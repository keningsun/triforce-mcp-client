import { NextRequest, NextResponse } from "next/server";
import authOptions from "@/lib/auth";
import NextAuth from "next-auth";

// 使用 NextAuth v4 App Router 适配处理
// 见文档: https://next-auth.js.org/configuration/initialization#route-handlers-app
const handler = NextAuth(authOptions);

// 添加包装函数以进行错误处理
async function nextAuthHandler(req: NextRequest, context: any) {
  try {
    console.log("NextAuth处理开始:", {
      method: req.method,
      path: context?.params?.nextauth || [],
      url: req.url,
    });

    // 调用原始NextAuth处理函数
    const response = await handler(req as any, context as any);

    console.log("NextAuth处理完成");
    return response;
  } catch (error) {
    console.error("NextAuth处理错误:", error);

    // 返回错误响应
    return NextResponse.json(
      { error: "Authentication service error" },
      { status: 500 }
    );
  }
}

// 导出 GET 和 POST 处理函数
export const GET = (
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) => {
  console.log("NextAuth GET Request Path:", context.params.nextauth);
  return nextAuthHandler(req, context);
};

export const POST = (
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) => {
  console.log("NextAuth POST Request Path:", context.params.nextauth);
  return nextAuthHandler(req, context);
};

// 明确标记为动态路由
export const dynamic = "force-dynamic";
