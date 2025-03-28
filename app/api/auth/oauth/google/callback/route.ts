import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// 使用全局变量保证Prisma实例唯一性，避免开发环境中的连接过多问题
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Google OAuth配置
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/oauth/google/callback`;

// 添加导出配置，明确标记为动态路由
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    console.log("===== Google OAuth回调处理开始 =====");

    // 获取URL参数
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    console.log("OAuth回调参数:", {
      code: code ? "已提供" : "未提供",
      state: state,
      error: error || "无错误",
    });

    // 获取当前会话用户
    const session = await getServerSession();
    console.log("当前会话用户:", session?.user?.email);

    if (!session?.user?.email) {
      console.log("无授权会话，重定向到登录页面");
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=unauthorized`
      );
    }

    // 检查错误
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=google_oauth_denied`
      );
    }

    // 验证state参数，防止CSRF攻击
    console.log("验证state参数...");
    const storedToken = await prisma.verification_tokens.findFirst({
      where: {
        identifier: `google_oauth_${session.user.email}`,
        token: state || "",
      },
    });

    console.log("验证token是否存在:", storedToken ? "是" : "否");

    if (!storedToken) {
      console.log("状态令牌验证失败，可能是CSRF攻击");
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=invalid_state`
      );
    }

    // 删除已使用的验证令牌
    await prisma.verification_tokens.delete({
      where: {
        identifier_token: {
          identifier: storedToken.identifier,
          token: storedToken.token,
        },
      },
    });
    console.log("已删除使用过的验证令牌");

    // 如果令牌已过期
    if (new Date() > storedToken.expires) {
      console.log("令牌已过期，过期时间:", storedToken.expires);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=expired_state`
      );
    }

    if (!code) {
      console.log("缺少授权码");
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=missing_code`
      );
    }

    // 交换code获取访问令牌
    console.log("开始交换授权码获取访问令牌...");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log("访问令牌获取结果:", {
      access_token: tokenData.access_token ? "获取成功(已隐藏)" : "获取失败",
      refresh_token: tokenData.refresh_token ? "获取成功(已隐藏)" : "未提供",
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      expires_in: tokenData.expires_in ? `${tokenData.expires_in}秒` : "未提供",
    });

    if (!tokenData.access_token) {
      console.error("访问令牌获取失败:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=token_exchange_failed`
      );
    }

    // 获取用户信息
    console.log("开始获取Google用户信息...");
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userInfo = await userInfoResponse.json();
    console.log("用户信息获取结果:", {
      id: userInfo.id,
      email: userInfo.email,
      verified_email: userInfo.verified_email,
      name: userInfo.name,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      picture: userInfo.picture ? "已提供" : "未提供",
      locale: userInfo.locale,
    });

    // 查找用户
    console.log("在数据库中查找用户:", session.user.email);
    const user = await prisma.users.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      console.log("数据库中未找到用户");
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=user_not_found`
      );
    }
    console.log("找到用户,ID:", user.id);

    // 检查是否已存在该提供商的令牌
    console.log("检查用户是否已有Google令牌...");
    const existingToken = await prisma.oauth_tokens.findFirst({
      where: {
        user_id: user.id,
        provider: "google",
      },
    });

    console.log("Google令牌状态:", existingToken ? "已存在" : "不存在");

    // 存储或更新OAuth令牌
    if (existingToken) {
      console.log("更新现有令牌,ID:", existingToken.id);
      // 更新现有令牌
      const updateData = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || existingToken.refresh_token,
        token_type: tokenData.token_type || "Bearer",
        scope: tokenData.scope || "",
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        extra_data: userInfo,
        updated_at: new Date(),
      };

      console.log("更新令牌数据:", {
        token_type: updateData.token_type,
        scope: updateData.scope,
        expires_at: updateData.expires_at
          ? updateData.expires_at.toISOString()
          : null,
        extra_data: "包含用户信息(已隐藏详情)",
        updated_at: updateData.updated_at.toISOString(),
      });

      await prisma.oauth_tokens.update({
        where: {
          id: existingToken.id,
        },
        data: updateData,
      });
      console.log("令牌更新成功");
    } else {
      console.log("创建新令牌...");
      // 创建新令牌
      const createData = {
        user_id: user.id,
        provider: "google",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_type: tokenData.token_type || "Bearer",
        scope: tokenData.scope || "",
        expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        extra_data: userInfo,
        created_at: new Date(),
        updated_at: new Date(),
      };

      console.log("新令牌数据:", {
        user_id: createData.user_id,
        provider: createData.provider,
        token_type: createData.token_type,
        scope: createData.scope,
        expires_at: createData.expires_at
          ? createData.expires_at.toISOString()
          : null,
        created_at: createData.created_at.toISOString(),
      });

      const newToken = await prisma.oauth_tokens.create({
        data: createData,
      });
      console.log("新令牌创建成功,ID:", newToken.id);
    }

    console.log("===== Google OAuth授权成功 =====");

    // 成功后返回HTML，自动关闭窗口
    return new NextResponse(
      `
      <html>
        <head>
          <title>Authorization Successful</title>
          <script>
            window.onload = function() {
              window.opener.postMessage({ type: 'OAUTH_CALLBACK', provider: 'google', success: true }, '*');
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
          <style>
            body { 
              font-family: system-ui, sans-serif;
              text-align: center;
              padding-top: 50px;
            }
          </style>
        </head>
        <body>
          Authorization successful. This window will close automatically.
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    // 更详细的错误记录
    const err = error as Error;
    console.error("Google OAuth回调处理错误详情:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: (err as any).code,
      cause: err.cause,
    });

    // 错误时也返回HTML，自动关闭窗口 - 使用正确的NextResponse格式
    return new NextResponse(
      `
      <html>
        <head>
          <title>Authorization Failed</title>
          <script>
            window.onload = function() {
              window.opener.postMessage({ type: 'OAUTH_CALLBACK', provider: 'google', success: false }, '*');
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
          <style>
            body { 
              font-family: system-ui, sans-serif;
              text-align: center;
              padding-top: 50px;
            }
          </style>
        </head>
        <body>
          Authorization failed. This window will close automatically.
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
