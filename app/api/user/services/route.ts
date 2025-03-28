import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 获取用户已连接的服务
export async function GET() {
  try {
    // 获取当前会话用户
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 查找用户
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 获取用户的OAuth令牌
    const oauthTokens = await prisma.oauth_tokens.findMany({
      where: { user_id: user.id },
      select: {
        provider: true,
        updated_at: true,
        expires_at: true,
      },
    });

    return NextResponse.json(oauthTokens);
  } catch (error) {
    console.error("Error fetching user services:", error);
    return NextResponse.json(
      { error: "Failed to fetch user services" },
      { status: 500 }
    );
  }
}

// 添加导出配置，明确标记为动态路由
export const dynamic = "force-dynamic";
