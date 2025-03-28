import { NextRequest, NextResponse } from "next/server";

// 处理客户端错误日志的路由
// NextAuth内部使用该路由记录客户端错误
export async function POST(req: NextRequest) {
  try {
    // 解析日志数据
    const data = await req.json();

    // 记录客户端错误信息
    console.error("[Client Error Log]", data);

    // 返回成功响应
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("处理客户端错误日志失败:", error);
    return NextResponse.json(
      { error: "Failed to process error log" },
      { status: 500 }
    );
  }
}

// GET方法也实现以保持兼容性
export async function GET() {
  return NextResponse.json({ ok: true });
}

// 明确标记为动态路由
export const dynamic = "force-dynamic";
