import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Slack OAuth配置
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || "";
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || "";

// 修复URL中可能出现的双斜杠问题
let baseUrl = process.env.NEXTAUTH_URL || "";
// 确保baseUrl不以斜杠结尾
if (baseUrl.endsWith("/")) {
  baseUrl = baseUrl.slice(0, -1);
}
const SLACK_REDIRECT_URI = `${baseUrl}/api/auth/oauth/slack/callback`;

export async function GET(request: Request) {
  try {
    // 获取URL参数
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // 获取当前会话用户
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=unauthorized`);
    }

    // 检查错误
    if (error) {
      console.error("Slack OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=slack_oauth_denied`
      );
    }

    // 验证state参数，防止CSRF攻击
    const storedToken = await prisma.verification_tokens.findFirst({
      where: {
        identifier: `slack_oauth_${session.user.email}`,
        token: state || "",
      },
    });

    if (!storedToken) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=invalid_state`
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

    // 如果令牌已过期
    if (new Date() > storedToken.expires) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=expired_state`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=missing_code`
      );
    }

    // 交换code获取访问令牌
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok || !tokenData.access_token) {
      console.error("Failed to exchange code for token:", tokenData);
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=token_exchange_failed`
      );
    }

    // 查找用户
    const user = await prisma.users.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=user_not_found`
      );
    }

    // 检查是否已存在该提供商的令牌
    const existingToken = await prisma.oauth_tokens.findFirst({
      where: {
        user_id: user.id,
        provider: "slack",
      },
    });

    // 存储或更新OAuth令牌
    if (existingToken) {
      // 更新现有令牌
      await prisma.oauth_tokens.update({
        where: {
          id: existingToken.id,
        },
        data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_type: tokenData.token_type || "Bearer",
          scope: tokenData.scope || "",
          updated_at: new Date(),
        },
      });
    } else {
      // 创建新令牌
      await prisma.oauth_tokens.create({
        data: {
          user_id: user.id,
          provider: "slack",
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_type: tokenData.token_type || "Bearer",
          scope: tokenData.scope || "",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    // 成功后返回HTML，自动关闭窗口
    return new NextResponse(
      `
      <html>
        <head>
          <title>Authorization Successful</title>
          <script>
            window.onload = function() {
              window.opener.postMessage({ type: 'OAUTH_CALLBACK', provider: 'slack', success: true }, '*');
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
    console.error("Slack OAuth callback error:", {
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
              window.opener.postMessage({ type: 'OAUTH_CALLBACK', provider: 'slack', success: false }, '*');
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

// 明确标记该路由为动态路由，避免静态生成
export const dynamic = "force-dynamic";
