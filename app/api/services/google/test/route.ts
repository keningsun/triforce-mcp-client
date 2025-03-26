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
            provider: "google",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查是否有Google令牌
    if (user.oauth_tokens.length === 0) {
      return NextResponse.json(
        { error: "Google not connected", connected: false },
        { status: 400 }
      );
    }

    const googleToken = user.oauth_tokens[0];

    // 测试Google API
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${googleToken.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: "Google API error",
          details: errorData.error,
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
    });
  } catch (error) {
    console.error("Google API test error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
