import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Slack OAuth配置
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || "";
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || "";
const SLACK_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/oauth/slack/callback`;
const SLACK_SCOPES = "chat:write,channels:read,users:read";

// Slack OAuth授权入口点
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
    const authUrl = new URL("https://slack.com/oauth/v2/authorize");
    authUrl.searchParams.set("client_id", SLACK_CLIENT_ID);
    authUrl.searchParams.set("scope", SLACK_SCOPES);
    authUrl.searchParams.set("redirect_uri", SLACK_REDIRECT_URI);
    authUrl.searchParams.set("state", state);

    // 将状态值存储到数据库，用于回调验证
    await prisma.verification_tokens.create({
      data: {
        identifier: `slack_oauth_${session.user.email}`,
        token: state,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10分钟过期
      },
    });

    // 重定向到Slack授权页面
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Slack OAuth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Slack OAuth flow" },
      { status: 500 }
    );
  }
}
