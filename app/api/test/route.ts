import { NextResponse } from "next/server";

export async function GET() {
  // 记录请求
  console.log("Test API route accessed");

  // 返回简单响应
  return NextResponse.json(
    {
      message: "API is working",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      nextauthUrl: process.env.NEXTAUTH_URL ? "configured" : "missing",
    },
    { status: 200 }
  );
}

// 添加导出配置，明确标记为动态路由
export const dynamic = "force-dynamic";
