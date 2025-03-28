import { NextRequest } from "next/server";
import authOptions from "@/lib/auth";
import NextAuth from "next-auth";

// 使用 NextAuth v4 App Router 适配处理
// 见文档: https://next-auth.js.org/configuration/initialization#route-handlers-app
const handler = NextAuth(authOptions);

// 导出 GET 和 POST 处理函数
export const GET = (
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) => {
  console.log("NextAuth GET Request Path:", context.params.nextauth);
  return handler(req as any, context as any);
};

export const POST = (
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) => {
  console.log("NextAuth POST Request Path:", context.params.nextauth);
  return handler(req as any, context as any);
};

// 明确标记为动态路由
export const dynamic = "force-dynamic";
