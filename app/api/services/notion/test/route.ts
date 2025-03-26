import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 获取当前会话用户
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 查找用户
    const user = await prisma.users.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        oauth_tokens: {
          where: {
            provider: "notion",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查是否有Notion令牌
    if (user.oauth_tokens.length === 0) {
      return NextResponse.json(
        { error: "Notion not connected", connected: false },
        { status: 400 }
      );
    }

    const notionToken = user.oauth_tokens[0];
    const workspaceInfo = notionToken.extra_data;

    // 测试Notion API
    const response = await fetch("https://api.notion.com/v1/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${notionToken.access_token}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: "Notion API error",
          details: errorData.message || "Unknown error",
          connected: false,
        },
        { status: 400 }
      );
    }

    const userData = await response.json();

    // 返回连接信息
    return NextResponse.json({
      connected: true,
      user: userData,
      workspace: workspaceInfo,
    });
  } catch (error) {
    console.error("Notion API test error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
