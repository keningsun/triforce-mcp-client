import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

// 使用全局变量保证Prisma实例唯一性，避免开发环境中的连接过多问题
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 获取Google OAuth令牌
    const token = await prisma.oauth_tokens.findFirst({
      where: {
        user_id: user.id,
        provider: "google",
      },
    });

    if (!token) {
      return NextResponse.json(
        {
          connected: false,
          message: "Google account not connected",
        },
        { status: 200 }
      );
    }

    // 计算令牌状态
    const now = new Date();
    const isExpired = token.expires_at ? now > token.expires_at : false;
    const canRefresh = !!token.refresh_token;

    // 计算距离过期的时间（如果有过期时间）
    let expiresIn = null;
    if (token.expires_at) {
      expiresIn = Math.floor(
        (token.expires_at.getTime() - now.getTime()) / 1000
      );
    }

    return NextResponse.json({
      connected: true,
      status: isExpired ? "expired" : "valid",
      can_refresh: canRefresh,
      expires_at: token.expires_at,
      expires_in: expiresIn,
      updated_at: token.updated_at,
      scope: token.scope,
    });
  } catch (error) {
    console.error("Google token status check error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
