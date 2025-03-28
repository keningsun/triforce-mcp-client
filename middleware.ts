import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 确保不拦截认证相关的API路由
  if (pathname.startsWith("/api/auth")) {
    // 针对认证API路由，确保不缓存
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("Cache-Control", "no-store, max-age=0");
    requestHeaders.set("Pragma", "no-cache");
    requestHeaders.set("Expires", "0");

    // 为WebAuthn API添加特殊头部
    if (pathname.startsWith("/api/auth/webauthn")) {
      requestHeaders.set("X-WebAuthn-Route", "true");
    }

    // 记录从客户端到服务器的关键API请求
    if (
      pathname === "/api/auth/session" ||
      pathname === "/api/auth/csrf" ||
      pathname === "/api/auth/callback/passkey"
    ) {
      const cookies = request.cookies.toString();
      console.log(`关键API请求: ${pathname}`, {
        method: request.method,
        hasCookies: cookies.length > 0,
        hasAuthorization: request.headers.has("authorization"),
      });
    }

    // 返回带有修改后头部的响应，但不执行身份验证逻辑
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  try {
    // 获取token来检查用户是否已认证
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    // 定义公共路径，不需要身份验证
    const publicPaths = ["/login", "/auth", "/api"];
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

    // 请求继续
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // 发生错误时，允许请求继续，避免阻塞关键功能
    return NextResponse.next();
  }
}

// 配置匹配路径
export const config = {
  matcher: [
    /*
     * 更精确的匹配路径:
     * 1. 排除静态资源和API日志路由
     * 2. 仅匹配页面路由
     */
    "/((?!_next/static|_next/image|_next/data|api/auth/_log|favicon.ico).*)",
    "/",
    "/dashboard",
    "/login",
    "/settings/:path*",
  ],
};
