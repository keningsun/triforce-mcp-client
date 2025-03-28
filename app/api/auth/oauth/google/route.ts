import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Google OAuth配置
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/oauth/google/callback`;
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

// Google OAuth授权入口点
export async function GET() {
  try {
    // 获取当前会话用户
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 生成OAuth状态值（防止CSRF攻击）
    const state = uuidv4();

    // 构建授权URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_SCOPES);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    // 将状态值存储到数据库，用于回调验证
    await prisma.verification_tokens.create({
      data: {
        identifier: `google_oauth_${session.user.email}`,
        token: state,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10分钟过期
      },
    });

    // 重定向到Google授权页面
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google OAuth flow" },
      { status: 500 }
    );
  }
}

// 添加导出配置，明确标记为动态路由
export const dynamic = "force-dynamic";
