import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取token来检查用户是否已认证
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // 定义公共路径，不需要身份验证
  const publicPaths = ["/login", "/api/auth"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // 如果用户未登录且尝试访问非公共路径，重定向到登录页面
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 如果用户已登录且尝试访问登录页面，重定向到仪表板
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 如果用户尝试访问根路径，重定向到合适的页面
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// 配置匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，但排除:
     * 1. 静态资源 (/_next/static, /_next/image, /favicon.ico，以及任何图片文件)
     * 2. 调试工具 (如/debug)
     * 注意: 不要过滤掉/api路径，因为某些API路径可能需要认证
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
