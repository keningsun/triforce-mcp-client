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

    // 删除Slack令牌
    await prisma.oauth_tokens.deleteMany({
      where: {
        user_id: user.id,
        provider: "slack",
      },
    });

    // 成功后重定向
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?success=slack_disconnected`
    );
  } catch (error) {
    console.error("Slack OAuth disconnect error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?error=server_error`
    );
  }
}

// 添加DELETE方法处理函数
export async function DELETE() {
  try {
    // 获取当前会话用户
    const session = await getServerSession();

    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 查找用户
    const user = await prisma.users.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `Attempting to delete OAuth token for user: ${user.id}, provider: slack`
    );

    // 删除Slack令牌
    const result = await prisma.oauth_tokens.deleteMany({
      where: {
        user_id: user.id,
        provider: "slack",
      },
    });

    console.log(`Deleted ${result.count} OAuth tokens`);

    // 返回成功响应
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("Slack OAuth disconnect error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
