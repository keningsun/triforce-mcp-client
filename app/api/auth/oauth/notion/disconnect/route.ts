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

    // 删除Notion令牌
    await prisma.oauth_tokens.deleteMany({
      where: {
        user_id: user.id,
        provider: "notion",
      },
    });

    // 成功后重定向
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?success=notion_disconnected`
    );
  } catch (error) {
    console.error("Notion OAuth disconnect error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?error=server_error`
    );
  }
}
