import { NextRequest, NextResponse } from "next/server";

// 处理所有HTTP方法的通用处理函数
async function handleRequest(req: NextRequest) {
  try {
    let data = {};

    // 如果是POST请求，尝试解析正文
    if (req.method === "POST") {
      try {
        data = await req.json();
      } catch (e) {
        // 如果解析失败，使用空对象
      }
    }

    // 只记录日志，不执行其他操作
    console.log("[Auth Client Log]", {
      method: req.method,
      path: req.nextUrl.pathname,
      data,
    });

    // 返回成功响应
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("处理客户端日志失败:", error);
    return NextResponse.json(
      { success: false },
      { status: 200 } // 返回200而非错误状态码，以避免客户端报错
    );
  }
}

// 实现所有常见HTTP方法
export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

export async function PUT(req: NextRequest) {
  return handleRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleRequest(req);
}

export async function PATCH(req: NextRequest) {
  return handleRequest(req);
}

// 确保是动态路由
export const dynamic = "force-dynamic";
