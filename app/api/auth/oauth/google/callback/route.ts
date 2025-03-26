import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Google OAuth配置
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/oauth/google/callback`;

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
    const storedToken = await prisma.verification_tokens.findFirst({
      where: {
        identifier: `google_oauth_${session.user.email}`,
        token: state || "",
      },
    });

    if (!storedToken) {
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

    // 如果令牌已过期
    if (new Date() > storedToken.expires) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=expired_state`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=missing_code`
      );
    }

    // 交换code获取访问令牌
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

    if (!tokenData.access_token) {
      console.error("Failed to exchange code for token:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=token_exchange_failed`
      );
    }

    // 获取用户信息
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userInfo = await userInfoResponse.json();

    // 查找用户
    const user = await prisma.users.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/integrations?error=user_not_found`
      );
    }

    // 检查是否已存在该提供商的令牌
    const existingToken = await prisma.oauth_tokens.findFirst({
      where: {
        user_id: user.id,
        provider: "google",
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
          refresh_token: tokenData.refresh_token || existingToken.refresh_token,
          token_type: tokenData.token_type || "Bearer",
          scope: tokenData.scope || "",
          expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          extra_data: userInfo,
          updated_at: new Date(),
        },
      });
    } else {
      // 创建新令牌
      await prisma.oauth_tokens.create({
        data: {
          id: uuidv4(),
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
        },
      });
    }

    // 成功后重定向
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?success=google_connected`
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?error=server_error`
    );
  }
}
