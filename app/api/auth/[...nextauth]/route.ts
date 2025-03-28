import authHandler from "@/lib/auth";

// 添加更详细的错误处理
export const GET = async (req: Request) => {
  try {
    console.log("NextAuth GET Request:", req.url);
    return await authHandler(req);
  } catch (error) {
    console.error("NextAuth GET Error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication handler failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST = async (req: Request) => {
  try {
    console.log("NextAuth POST Request:", req.url);
    return await authHandler(req);
  } catch (error) {
    console.error("NextAuth POST Error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication handler failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
