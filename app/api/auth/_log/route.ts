// 使用最基本的Web API Response对象，避开Next.js框架问题

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(req: Request) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: Request) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// 捕获所有其他方法
export const OPTIONS = POST;
export const PUT = POST;
export const DELETE = POST;
export const PATCH = POST;
