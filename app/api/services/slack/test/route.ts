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
            provider: "slack",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查是否有Slack令牌
    if (user.oauth_tokens.length === 0) {
      return NextResponse.json(
        { error: "Slack not connected", connected: false },
        { status: 400 }
      );
    }

    const slackToken = user.oauth_tokens[0];

    // 测试Slack API
    const response = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${slackToken.access_token}`,
      },
    });

    const responseData = await response.json();

    if (!responseData.ok) {
      return NextResponse.json(
        {
          error: "Slack API error",
          details: responseData.error,
          connected: false,
        },
        { status: 400 }
      );
    }

    // 返回连接信息
    return NextResponse.json({
      connected: true,
      workspace: responseData.team,
      user: responseData.user,
    });
  } catch (error) {
    console.error("Slack API test error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
