import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";

// 处理会话请求，确保返回正确的JSON格式
export async function GET(req: NextRequest) {
  try {
    console.log("处理/api/auth/session请求", {
      url: req.url,
      headers: Object.fromEntries(req.headers),
    });

    // 获取服务器端会话
    const session = await getServerSession(authOptions);

    console.log("会话状态:", {
      isAuthenticated: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
    });

    // 设置响应头，确保不缓存
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    };

    // 如果没有会话，返回空对象
    if (!session) {
      return NextResponse.json({}, { headers });
    }

    // 返回会话数据
    return NextResponse.json(session, { headers });
  } catch (error) {
    console.error("获取会话失败:", error);

    // 发生错误时，返回500错误
    return NextResponse.json(
      { error: "Failed to get session" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}

// 明确标记为动态路由
export const dynamic = "force-dynamic";
