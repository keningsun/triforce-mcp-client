import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Notion OAuth配置
const NOTION_CLIENT_ID = String(process.env.NOTION_CLIENT_ID || "");
const NOTION_CLIENT_SECRET = String(process.env.NOTION_CLIENT_SECRET || "");
const NOTION_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/oauth/notion/callback`;

// 输出环境变量值用于调试
console.log("NOTION_CLIENT_ID:", NOTION_CLIENT_ID);
console.log("NOTION_REDIRECT_URI:", NOTION_REDIRECT_URI);

// Notion OAuth授权入口点
export async function GET() {
  try {
    // 获取当前会话用户
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 打印环境变量，确认在请求处理时是否正确加载
    console.log("In Notion GET request - NOTION_CLIENT_ID:", NOTION_CLIENT_ID);
    console.log(
      "In Notion GET request - NEXTAUTH_URL:",
      process.env.NEXTAUTH_URL
    );

    // 生成OAuth状态值（防止CSRF攻击）
    const state = uuidv4();

    // 构建授权URL
    const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");
    authUrl.searchParams.set("client_id", NOTION_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", NOTION_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("owner", "user");
    authUrl.searchParams.set("state", state);

    // 打印完整的授权URL
    console.log("Notion Auth URL:", authUrl.toString());

    // 将状态值存储到数据库，用于回调验证
    await prisma.verification_tokens.create({
      data: {
        identifier: `notion_oauth_${session.user.email}`,
        token: state,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10分钟过期
      },
    });

    // 重定向到Notion授权页面
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    // 使用明确的错误处理，避免任何语法问题
    console.log("Notion OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initiate Notion OAuth flow" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
