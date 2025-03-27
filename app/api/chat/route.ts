import { experimental_createMCPClient, streamText } from "ai";
import { openai } from "@ai-sdk/openai";

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

// 添加MCP客户端保活函数
const setupMcpHeartbeat = (mcpClient: any) => {
  if (!mcpClient) return;

  // 每4分钟发送一次ping，避免5分钟超时断开
  const HEARTBEAT_INTERVAL = 4 * 60 * 1000; // 4分钟

  const heartbeatInterval = setInterval(async () => {
    try {
      // 发送getTools请求来保持连接活跃
      console.log("发送MCP心跳保持连接...");
      await mcpClient.tools();
      console.log("MCP心跳成功");
    } catch (error) {
      console.error("MCP心跳失败:", error);
      // 心跳失败时清除interval，避免继续尝试
      clearInterval(heartbeatInterval);
    }
  }, HEARTBEAT_INTERVAL);

  return heartbeatInterval;
};

// 创建MCP客户端的函数
const createMCPClientFromEnv = async (userId: string) => {
  const mcpServerUrl = process.env.MCP_SERVER_BASE_URL || "";
  if (!mcpServerUrl) {
    throw new Error("MCP_SERVER_BASE_URL environment variable is not set");
  }

  // 构建完整的SSE URL，包含userId参数
  const sseUrl = `${mcpServerUrl}?userId=${userId}`;
  console.log("Connecting to MCP server at:", sseUrl);

  // 使用experimental_createMCPClient直接创建客户端
  return await experimental_createMCPClient({
    transport: {
      type: "sse",
      url: sseUrl,
    },
  });
};

// 添加调试用的监控流函数
async function monitorStream(
  stream: ReadableStream,
  label: string
): Promise<ReadableStream> {
  console.log(`开始监控 ${label} 流`);

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let allRawData = "";

  // 创建一个新的流
  const newStream = new ReadableStream({
    async start(controller) {
      let chunkCounter = 0;
      let textContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log(`${label} 流结束，共接收 ${chunkCounter} 个数据块`);
            console.log(`解析得到的文本内容: ${textContent}`);
            console.log(`完整原始数据流内容: ${allRawData}`);
            controller.close();
            break;
          }

          chunkCounter++;
          chunks.push(value);

          // 解析数据块内容并保存原始数据
          const text = new TextDecoder().decode(value);
          allRawData += text;

          // 检查不同类型的数据块
          if (text.startsWith("text:")) {
            const actualText = text.substring(5); // 移除 'text:' 前缀
            textContent += actualText;
            console.log(`解析到文本: ${actualText}`);
          } else if (text.startsWith("tool_call:")) {
            console.log(`解析到工具调用块: ${text}`);
          } else if (text.startsWith("tool_result:")) {
            console.log(`解析到工具结果块: ${text}`);
          } else if (text.startsWith("data:")) {
            console.log(`解析到data块: ${text}`);
          }

          // 打印详细的数据块信息
          console.log(
            `${label} 流数据块 #${chunkCounter} (${value.length} bytes): ${text}`
          );

          // 将数据传递给新流
          controller.enqueue(value);
        }
      } catch (error) {
        console.error(`${label} 流处理错误:`, error);
        controller.error(error);
      }
    },
  });

  return newStream;
}

// 添加工具调用结果处理工具函数
const handleToolCallsResult = async (
  completion: any,
  mcpClient: any,
  prompt: string,
  systemMessage: string
) => {
  console.log("处理工具调用结果...");

  if (!completion.toolCalls || completion.toolCalls.length === 0) {
    console.log("没有工具调用结果需要处理");
    return completion;
  }

  try {
    // 提取所有工具调用的结果
    const toolResults = completion.toolCalls.map((call: any) => {
      let result = "未获得结果";
      if ("output" in call && call.output) {
        // 尝试格式化JSON结果
        try {
          if (typeof call.output === "string") {
            // 如果是JSON字符串，尝试解析
            const parsed = JSON.parse(call.output);
            result = JSON.stringify(parsed, null, 2);
          } else {
            // 如果已经是对象，直接格式化
            result = JSON.stringify(call.output, null, 2);
          }
        } catch (e) {
          // 如果不是JSON或解析失败，直接使用原始输出
          result = String(call.output);
        }
      }

      return {
        tool_call_id: call.toolCallId,
        name: call.toolName,
        result: result,
      };
    });

    // 创建工具结果消息格式
    const toolResultsContent = toolResults
      .map(
        (result: { name: string; result: string }) =>
          `工具: ${result.name}\n结果:\n${result.result}`
      )
      .join("\n\n");

    // 创建新的提示，包含原始提示和工具调用结果
    const toolResultPrompt = `
${prompt}

我使用了以下工具并获取了结果，请基于这些结果回答用户的问题:

${toolResultsContent}
`;

    console.log("带工具结果的新提示:", toolResultPrompt);

    // 创建新的流式回复请求
    const finalResponse = await streamText({
      model: openai("gpt-4o"),
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: toolResultPrompt },
      ],
      maxTokens: 4096,
      temperature: 0.7,
    });

    // 读取流式响应内容
    const reader = finalResponse.toDataStream().getReader();
    let finalText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      if (chunk.startsWith("text:")) {
        finalText += chunk.substring(5);
      }
      console.log("收到流式响应块:", chunk);
    }

    console.log("最终组合的文本回复:", finalText);
    return {
      ...completion,
      text: finalText || "未能获取工具调用后的回复",
      finishReason: "stop",
    };
  } catch (error) {
    console.error("处理工具调用结果时出错:", error);
    return {
      ...completion,
      text:
        "处理工具调用结果时出错: " +
        (error instanceof Error ? error.message : String(error)),
      finishReason: "error",
    };
  }
};

export async function POST(req: Request) {
  console.log("Chat API received request");
  let mcpClient: any = null;
  let heartbeatInterval: NodeJS.Timeout | undefined;

  try {
    // 从请求中获取数据，兼容AI SDK格式
    const body = await req.json();
    console.log("接收到的完整请求体:", JSON.stringify(body));

    // 检查请求格式 - AI SDK可能将消息放在messages字段中
    let prompt: string;
    let userId: string;

    if (body.messages && Array.isArray(body.messages)) {
      // AI SDK格式 - 使用最后一条用户消息作为prompt
      const userMessages = body.messages.filter(
        (m: { role: string; content: string }) => m.role === "user"
      );
      if (userMessages.length === 0) {
        console.error("没有在请求中找到用户消息");
        return new Response(
          JSON.stringify({ error: "No user message found in the request" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      prompt = userMessages[userMessages.length - 1].content;
      userId = body.userId || "anonymous";
      console.log("使用AI SDK格式解析提取的消息:", {
        prompt,
        lastUserMessage: userMessages[userMessages.length - 1],
        totalMessages: body.messages.length,
      });
    } else {
      // 传统格式
      prompt = body.prompt;
      userId = body.userId;
      console.log("使用传统格式解析提取的消息");
    }

    console.log("Request payload:", {
      prompt: prompt ? prompt.substring(0, 50) + "..." : "[undefined]",
      userId,
    });

    if (!prompt || typeof prompt !== "string") {
      console.error("提示缺失或格式错误:", prompt);
      return new Response(
        JSON.stringify({ error: "Prompt is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userId || typeof userId !== "string") {
      console.error("用户ID缺失或格式错误:", userId);
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

    try {
      // 使用带超时的MCP客户端创建
      console.log("Creating MCP client...");
      mcpClient = await withTimeout(
        createMCPClientFromEnv(userId),
        60000 // 60秒超时
      );
      console.log("MCP client created successfully");

      // 设置心跳
      heartbeatInterval = setupMcpHeartbeat(mcpClient);

      // 获取MCP工具
      console.log("Fetching tools...");
      const tools: any = await withTimeout(mcpClient.tools(), 30000);
      console.log(`Retrieved ${Object.keys(tools).length} tools`);

      // 输出工具名称以便调试
      const toolNames = Object.keys(tools);
      console.log(
        "可用工具列表:",
        toolNames.slice(0, 10),
        toolNames.length > 10 ? `...及其他${toolNames.length - 10}个` : ""
      );

      // 定义系统消息
      const systemMessage =
        "You are Triforce, a helpful AI assistant with access to external tools through the Multi-Cloud Platform (MCP). " +
        "When appropriate, use these tools to provide more accurate and useful responses. " +
        "Available tools include Google Calendar, Gmail, Google Services, and more. " +
        "Important: You already have the user's identity and authorization. The user's ID has been provided to the system, " +
        "so you DO NOT need to ask for the user's ID, email, or any identifying information. " +
        "All authentication and identity information is handled automatically in the background. " +
        `When using tools, always use the actual userId value '${userId}' as the user_id parameter, NOT the string 'user_id'. ` +
        "You can directly use the tools to access the user's data as the authentication has already been handled. " +
        "Analyze the user's query carefully and decide when tools can help provide better information. " +
        "Use tools proactively when they can enhance your response, but avoid using them when unnecessary.";

      // 使用 Vercel AI SDK 的 streamText 函数处理请求
      console.log("创建流式完成，请求参数:", {
        model: "gpt-4o",
        messageCount: body.messages?.length || 1,
        toolCount: Object.keys(tools).length,
        prompt: prompt.substring(0, 30) + "...",
      });

      const response = await streamText({
        model: openai("gpt-4o"),
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        tools: tools, // 直接传入MCP工具集
        maxTokens: 4096,
        toolChoice: "auto", // 确保模型可以自由选择是否使用工具
        temperature: 0.7, // 适度的创造性
        maxSteps: 3, // 允许最多3轮工具调用循环
        // 在流式响应完成后关闭MCP客户端
        onFinish: async (completion) => {
          console.log("==================== 流式完成结束 ====================");
          console.log("答案长度:", completion.text.length);
          console.log("finishReason:", completion.finishReason);
          console.log("toolCalls存在:", !!completion.toolCalls);
          console.log("toolCalls数量:", completion.toolCalls?.length || 0);

          try {
            // 检查是否是工具调用结束
            if (
              completion.finishReason === "tool-calls" &&
              completion.toolCalls &&
              completion.toolCalls.length > 0
            ) {
              console.log("检测到工具调用完成，处理工具结果...");

              // 处理工具调用结果
              const processedResult = await handleToolCallsResult(
                completion,
                mcpClient,
                prompt,
                systemMessage
              );
              console.log(
                "工具结果处理完成，最终回复长度:",
                processedResult.text.length
              );

              // 更新completion对象
              Object.assign(completion, processedResult);
            }

            // 继续记录和处理
            if (completion.toolCalls && completion.toolCalls.length > 0) {
              console.log(
                "完整工具调用详情:",
                JSON.stringify(completion.toolCalls, null, 2)
              );

              // 记录每个工具调用的详细信息
              completion.toolCalls.forEach((call, index) => {
                console.log(`工具调用 #${index + 1}:`);
                console.log(`  类型: ${call.type}`);
                console.log(`  工具ID: ${call.toolCallId}`);
                console.log(`  工具名称: ${call.toolName}`);
                console.log(`  参数: ${JSON.stringify(call.args)}`);

                // 使用可选链和类型检查
                if ("status" in call) {
                  console.log(`  结果状态: ${(call as any).status || "未知"}`);
                }

                if ("output" in call) {
                  console.log(
                    `  工具输出: ${JSON.stringify((call as any).output)}`
                  );
                }
              });
            }

            if (completion.text.length > 0) {
              console.log(
                "最终答案前100字符:",
                completion.text.substring(0, 100) + "..."
              );
            } else {
              console.log("最终答案内容为空");
            }
          } catch (error) {
            console.error("处理完成数据时出错:", error);
          } finally {
            // 清理心跳
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              console.log("MCP客户端心跳已清理");
            }
            // 关闭MCP客户端
            await mcpClient.close();
            console.log("MCP client closed after stream completion");
          }
        },
      });

      console.log("获得流式响应，准备返回到客户端");

      // 转换为可以监控的流
      const dataStream = response.toDataStream();
      const monitoredStream = await monitorStream(dataStream, "数据流");

      // 创建一个正确的数据流响应
      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "x-vercel-ai-data-stream": "v1",
      };

      return new Response(monitoredStream, { headers });
    } catch (toolError: any) {
      console.error("Error fetching or using tools:", toolError);
      if (mcpClient) {
        // 清理心跳
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          console.log("MCP客户端心跳已清理");
        }

        await mcpClient.close();
      }
      console.log("MCP client closed after tool error");

      // 回退到没有工具的模式并使用流式响应
      console.log("Falling back to streaming completion without tools...");
      const response = await streamText({
        model: openai("gpt-4o"),
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. The user tried to use MCP tools but there was an error with the tools. Please respond to their query as best you can without using tools, and inform them there was a tool error.",
          },
          { role: "user", content: prompt },
        ],
        onFinish: async (completion) => {
          console.log("流式完成结束(回退), 答案长度:", completion.text.length);
          console.log(
            "回退答案前100字符:",
            completion.text.substring(0, 100) + "..."
          );
        },
      });

      // 转换为可以监控的流
      const dataStream = response.toDataStream();
      const monitoredStream = await monitorStream(dataStream, "回退数据流");

      // 创建一个正确的数据流响应
      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "x-vercel-ai-data-stream": "v1",
        "x-tool-error":
          "There was an error fetching or using the requested tools. Responding without tools.",
      };

      return new Response(monitoredStream, { headers });
    }
  } catch (error: any) {
    // 确保在任何情况下都关闭MCP客户端
    if (mcpClient) {
      try {
        // 清理心跳
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          console.log("MCP客户端心跳已清理");
        }

        await mcpClient.close();
        console.log("MCP client closed after general error");
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }

    console.error("MCP Chat error:", error);
    console.error("Error stack:", error.stack);
    return Response.json(
      {
        error: "Failed to process request",
        details: error.message || "Unknown error",
        code: error.message?.includes("timeout")
          ? "TIMEOUT_ERROR"
          : error.message?.includes("connection")
          ? "CONNECTION_ERROR"
          : "UNKNOWN_ERROR",
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
