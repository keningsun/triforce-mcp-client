import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 获取当前会话用户
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=unauthorized`
      );
    }

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

    // 删除Google令牌
    await prisma.oauth_tokens.deleteMany({
      where: {
        user_id: user.id,
        provider: "google",
      },
    });

    // 成功后重定向
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?success=google_disconnected`
    );
  } catch (error) {
    console.error("Google OAuth disconnect error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?error=server_error`
    );
  }
}

// 添加DELETE方法的处理函数
export async function DELETE() {
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

    // 删除Google令牌
    await prisma.oauth_tokens.deleteMany({
      where: {
        user_id: user.id,
        provider: "google",
      },
    });

    // 返回成功响应
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google OAuth disconnect error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
