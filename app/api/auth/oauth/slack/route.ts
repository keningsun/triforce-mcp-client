import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Slack OAuth配置
const SLACK_CLIENT_ID = String(process.env.SLACK_CLIENT_ID || "");
const SLACK_CLIENT_SECRET = String(process.env.SLACK_CLIENT_SECRET || "");

// 修复URL中可能出现的双斜杠问题
let baseUrl = process.env.NEXTAUTH_URL || "";
// 确保baseUrl不以斜杠结尾
if (baseUrl.endsWith("/")) {
  baseUrl = baseUrl.slice(0, -1);
}
const SLACK_REDIRECT_URI = `${baseUrl}/api/auth/oauth/slack/callback`;

const SLACK_SCOPES = "chat:write,channels:read,users:read";

// 输出环境变量值用于调试
console.log("SLACK_CLIENT_ID:", SLACK_CLIENT_ID);
console.log("SLACK_REDIRECT_URI:", SLACK_REDIRECT_URI);

// Slack OAuth授权入口点
export async function GET() {
  try {
    // 获取当前会话用户
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 打印环境变量，确认在请求处理时是否正确加载
    console.log("In Slack GET request - SLACK_CLIENT_ID:", SLACK_CLIENT_ID);
    console.log(
      "In Slack GET request - NEXTAUTH_URL:",
      process.env.NEXTAUTH_URL
    );

    // 生成OAuth状态值（防止CSRF攻击）
    const state = uuidv4();

    // 构建授权URL
    const authUrl = new URL("https://slack.com/oauth/v2/authorize");
    authUrl.searchParams.set("client_id", SLACK_CLIENT_ID);
    authUrl.searchParams.set("scope", SLACK_SCOPES);
    authUrl.searchParams.set("redirect_uri", SLACK_REDIRECT_URI);
    authUrl.searchParams.set("state", state);

    // 打印完整的授权URL
    console.log("Slack Auth URL:", authUrl.toString());

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
    // 使用明确的错误处理，避免任何语法问题
    console.log("Slack OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initiate Slack OAuth flow" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 明确标记该路由为动态路由，避免静态生成
export const dynamic = "force-dynamic";
