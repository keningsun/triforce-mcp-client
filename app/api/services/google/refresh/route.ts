import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { refreshGoogleToken } from "@/lib/refresh-google-token";

export async function GET() {
  try {
    console.log("===== 开始通过API刷新Google OAuth令牌 =====");

    // 获取当前会话用户
    const session = await getServerSession();
    console.log("当前会话用户:", session?.user?.email);

    if (!session?.user?.email) {
      console.log("无授权会话");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 查找用户
    // 这里我们只需要用户的ID，实际刷新逻辑移到了lib/refresh-google-token.ts中
    const userEmail = session.user.email;

    // 调用刷新令牌函数
    const result = await refreshGoogleToken(userEmail);

    if (!result.success) {
      console.log("刷新令牌失败:", result.error);
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      );
    }

    return NextResponse.json({
      refreshed: result.refreshed,
      expires_at: result.expires_at,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Google OAuth令牌刷新API错误:", {
      message: err.message,
      stack: err.stack,
    });
    return NextResponse.json(
      { error: "Failed to refresh Google OAuth token" },
      { status: 500 }
    );
  }
}
