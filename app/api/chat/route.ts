import { experimental_createMCPClient, streamText } from "ai";
import OpenAI from "openai";

// 配置OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 添加超时函数辅助函数
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
  });
};

export async function POST(req: Request) {
  console.log("Chat API received request");
  let mcpClient: any = null;

  try {
    const { prompt, userId } = await req.json();
    console.log("Request payload:", {
      prompt: prompt.substring(0, 50) + "...",
      userId,
    });

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "User ID is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 检查OpenAI API密钥
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({ error: "OpenAI API key is missing" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("OpenAI API key is present (length):", openaiKey.length);

    // 使用环境变量获取基础URL
    let mcpServerUrl = process.env.MCP_SERVER_BASE_URL || "";
    console.log("MCP Server base URL from env:", mcpServerUrl);

    // 构建完整的SSE URL
    const sseUrl = `${mcpServerUrl}?userId=${userId}`;
    console.log("Connecting to MCP server at:", sseUrl);

    // 连接到MCP服务器获取工具，添加10秒超时
    console.log("Creating MCP client (with 10s timeout)...");
    try {
      mcpClient = await withTimeout(
        experimental_createMCPClient({
          transport: {
            type: "sse",
            url: sseUrl,
          },
        }),
        10000 // 10 seconds timeout
      );
      console.log("MCP client created successfully");
    } catch (clientError) {
      console.error("Failed to create MCP client:", clientError);
      // 回退到普通的OpenAI调用
      console.log(
        "Falling back to regular OpenAI completion due to MCP client failure..."
      );
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. The user tried to use MCP tools but there was an error connecting to the tools server. Please respond to their query as best you can without using tools.",
          },
          { role: "user", content: prompt },
        ],
      });

      return new Response(
        JSON.stringify({ text: completion.choices[0].message.content }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 尝试获取工具
    try {
      console.log("Fetching tools (with 5s timeout)...");
      const tools = await withTimeout(mcpClient.tools(), 5000); // 5 seconds timeout
      console.log(
        "Tools fetched successfully:",
        Object.keys(tools as object).length,
        "tools available"
      );

      // 使用非流式响应避免ReadableStream锁定问题
      console.log("Creating OpenAI chat completion (non-streaming)...");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = completion.choices[0].message.content || "";
      console.log("Completion received, cleaning up...");

      // 确保关闭MCP客户端
      if (mcpClient) {
        await mcpClient.close();
        console.log("MCP client closed after completion");
      }

      // 返回JSON响应而非流式响应
      return new Response(JSON.stringify({ text: responseText }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (toolError: any) {
      console.error("Error fetching or using tools:", toolError);
      if (mcpClient) await mcpClient.close();
      console.log("MCP client closed after tool error");

      // 回退到普通OpenAI完成（不使用工具）
      console.log("Falling back to regular OpenAI completion...");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. The user tried to use MCP tools but there was an error connecting to the tools server. Please respond to their query as best you can without using tools.",
          },
          { role: "user", content: prompt },
        ],
      });

      return new Response(
        JSON.stringify({ text: completion.choices[0].message.content }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    // 确保在任何情况下都关闭MCP客户端
    if (mcpClient) {
      try {
        await mcpClient.close();
        console.log("MCP client closed after general error");
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }

    console.error("MCP Chat error:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error.message || "Unknown error",
        stack: error.stack,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
