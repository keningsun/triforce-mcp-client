import { useState, useEffect, useCallback } from "react";
import { useChat } from "ai/react";

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

// 添加错误类型定义，用于更精确的错误处理
type McpErrorType =
  | "connection_error"
  | "timeout_error"
  | "tool_error"
  | "server_error"
  | "auth_error"
  | "unknown_error";

// 错误消息映射
const errorMessages: Record<McpErrorType, string> = {
  connection_error:
    "I'm having trouble connecting to the tools server. This might be due to network issues or server unavailability. Let me help you without using external tools for now.",
  timeout_error:
    "The connection to the tools server timed out. This could be due to high server load or network latency. I'll try to assist you without tools for now.",
  tool_error:
    "There was an error while using the requested tool. The tool might be temporarily unavailable or there might be an issue with the parameters.",
  server_error:
    "The server encountered an internal error. This is likely a temporary issue. Please try again in a few moments.",
  auth_error:
    "There seems to be an authentication issue with the tools server. Your session might have expired.",
  unknown_error:
    "An unexpected error occurred. I'll try to assist you without using external tools.",
};

// 检测错误类型的函数
const detectErrorType = (error: string): McpErrorType => {
  const errorLower = error.toLowerCase();

  if (errorLower.includes("timeout") || errorLower.includes("timed out")) {
    return "timeout_error";
  } else if (
    errorLower.includes("connect") ||
    errorLower.includes("connection") ||
    errorLower.includes("client closed")
  ) {
    return "connection_error";
  } else if (
    errorLower.includes("tool") ||
    errorLower.includes("execution failed")
  ) {
    return "tool_error";
  } else if (errorLower.includes("server") || errorLower.includes("500")) {
    return "server_error";
  } else if (
    errorLower.includes("auth") ||
    errorLower.includes("unauthorized") ||
    errorLower.includes("login")
  ) {
    return "auth_error";
  } else {
    return "unknown_error";
  }
};

interface UseMCPChatProps {
  userId: string;
  initialMessages?: Message[];
}

export function useMCPChat({ userId, initialMessages = [] }: UseMCPChatProps) {
  // 使用 Vercel AI SDK 的 useChat 钩子
  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error: aiError,
    data,
  } = useChat({
    api: "/api/chat",
    body: {
      userId: userId,
    },
    initialMessages: initialMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
    })),
    maxSteps: 20, // 允许最多3轮工具调用循环
    onFinish: (message) => {
      console.log("onFinish called with message:", message);
    },
  });

  // 保存最新的工具调用数据
  const [toolData, setToolData] = useState<any>(null);
  // 保存提取的文本内容
  const [extractedContent, setExtractedContent] = useState<string>("");

  // 当收到数据时解析并提取内容
  useEffect(() => {
    if (data) {
      console.log("useChat data received:", data);
      setToolData(data);

      // 尝试提取数据中的文本内容
      try {
        // 打印完整数据结构以便调试
        console.log("接收到的完整数据:", JSON.stringify(data));

        if (Array.isArray(data)) {
          // 处理数据数组
          let foundText = false;
          const textChunks = data
            .filter((chunk) => typeof chunk === "string")
            .map((chunk) => {
              if (typeof chunk === "string") {
                console.log("处理数据块:", chunk);

                // 检查各种可能的前缀
                if (chunk.startsWith("text:")) {
                  foundText = true;
                  return chunk.substring(5); // 移除'text:'前缀
                } else if (chunk.startsWith("tool_call:")) {
                  console.log("发现工具调用数据:", chunk);
                  return "";
                } else if (chunk.startsWith("tool_result:")) {
                  console.log("发现工具结果数据:", chunk);
                  // 尝试从工具结果中提取有用的文本
                  const resultData = chunk.substring(12); // 移除'tool_result:'前缀
                  try {
                    const resultObj = JSON.parse(resultData);
                    if (resultObj && typeof resultObj === "object") {
                      const extractedToolResult =
                        extractTextFromToolResult(resultObj);
                      if (extractedToolResult) {
                        return `\n工具结果: ${extractedToolResult}\n`;
                      }
                    }
                  } catch (e) {
                    console.error("解析工具结果失败:", e);
                  }
                  return "";
                } else if (chunk.startsWith("data:")) {
                  console.log("发现数据块:", chunk);
                  return "";
                } else {
                  // 可能是普通文本
                  return chunk;
                }
              }
              return "";
            })
            .filter((text) => text.length > 0);

          if (textChunks.length > 0) {
            const combinedText = textChunks.join("");
            console.log("提取到文本内容:", combinedText);
            setExtractedContent(combinedText);
          } else if (!foundText && typeof data[data.length - 1] === "object") {
            // 没有找到文本，但有对象，可能是工具调用结果
            console.log("没有找到文本，尝试从最后一个对象提取数据");
            const lastItem = data[data.length - 1];
            const toolText = extractTextFromToolData(lastItem);
            if (toolText) {
              console.log("从工具数据提取到文本:", toolText);
              setExtractedContent(toolText);
            }
          }
        } else if (typeof data === "object" && data !== null) {
          // 处理对象形式的数据
          const dataObj = data as Record<string, unknown>;

          if ("text" in dataObj && typeof dataObj.text === "string") {
            console.log("从对象中提取文本:", dataObj.text);
            setExtractedContent(dataObj.text);
          } else if (
            "content" in dataObj &&
            typeof dataObj.content === "string"
          ) {
            console.log("从对象中提取内容:", dataObj.content);
            setExtractedContent(dataObj.content);
          } else if ("toolCalls" in dataObj) {
            // 尝试从工具调用中提取有用的信息
            console.log("尝试从工具调用对象中提取数据");
            const toolText = extractTextFromToolData(dataObj);
            if (toolText) {
              console.log("从工具调用中提取到文本:", toolText);
              setExtractedContent(toolText);
            }
          }
        }
      } catch (error) {
        console.error("解析数据内容时出错:", error);
      }
    }
  }, [data]);

  // 转换 AI SDK 消息到我们的消息格式，包含工具调用信息
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [error, setError] = useState<string | null>(null);

  // 当 AI SDK 消息更新时，更新我们的消息，同时考虑提取的内容
  useEffect(() => {
    if (aiMessages.length > 0) {
      // 创建一个新的消息数组，避免直接依赖 extractedContent
      const convertedMessages = aiMessages.map((msg) => {
        return {
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          timestamp: new Date(),
        };
      });

      setMessages(convertedMessages);
    }
  }, [aiMessages]); // 只依赖 aiMessages，移除对 extractedContent 的依赖

  // 当 AI SDK 错误更新时，更新我们的错误
  useEffect(() => {
    if (aiError) {
      setError(aiError.message);

      // 检测错误类型
      const errorType = detectErrorType(aiError.message || "unknown error");
      const friendlyMessage = errorMessages[errorType];

      // 添加友好错误消息到对话
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `${friendlyMessage}\n\nTechnical details: ${aiError.message}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [aiError]);

  // 添加日志以便调试
  useEffect(() => {
    if (data) {
      console.log("useChat data received:", data);
    }
  }, [data]);

  // 添加工具调用日志
  useEffect(() => {
    // 检查是否有空内容的消息（可能是工具调用）
    const emptyMessages = aiMessages.filter(
      (msg) => msg.role === "assistant" && msg.content === ""
    );

    if (emptyMessages.length > 0) {
      console.log("Empty assistant messages detected:", emptyMessages.length);
      console.log("Tool usage may be in progress");
    }
  }, [aiMessages]);

  // 单独处理 extractedContent 到最后一条 assistant 消息
  useEffect(() => {
    // 确保有提取内容，且当前有消息
    if (extractedContent && aiMessages.length > 0) {
      // 找到最后一条助手消息
      const lastAssistantMsgIndex = [...aiMessages]
        .reverse()
        .findIndex((msg) => msg.role === "assistant" && msg.content === "");

      if (lastAssistantMsgIndex >= 0) {
        // 计算实际索引（从数组末尾倒数）
        const actualIndex = aiMessages.length - 1 - lastAssistantMsgIndex;

        // 更新特定消息而不是整个消息数组
        setMessages((prevMessages) => {
          // 确保我们有足够的消息
          if (prevMessages.length <= actualIndex) return prevMessages;

          // 创建新的消息数组
          const newMessages = [...prevMessages];
          // 只更新特定的消息
          newMessages[actualIndex] = {
            ...newMessages[actualIndex],
            content: extractedContent,
          };

          return newMessages;
        });
      }
    }
  }, [extractedContent, aiMessages]); // 这个 effect 依赖于 extractedContent 和 aiMessages

  // 适配 handleSendMessage 方法
  const handleSendMessage = useCallback(
    (content: string = input) => {
      if (!content.trim() || isLoading) return;

      // 调用 useChat 提供的 handleSubmit 方法，正确传递参数
      const formData = new FormData();
      formData.append("prompt", content);

      // 创建一个模拟的表单事件
      const mockEvent = {
        preventDefault: () => {},
        currentTarget: {
          elements: {
            prompt: { value: content },
          },
        },
      };

      // 调用 handleSubmit 方法
      handleSubmit(mockEvent as any);
    },
    [input, isLoading, handleSubmit]
  );

  return {
    messages,
    input,
    handleInputChange,
    handleSendMessage,
    isLoading,
    error,
    toolData,
    extractedContent,
  };
}

// 辅助函数：从工具结果中提取可读文本
const extractTextFromToolResult = (result: any): string => {
  if (!result) return "";

  // 处理日历事件类型
  if (result.items && Array.isArray(result.items)) {
    if (result.items.length === 0) {
      return "没有找到任何会议或日历事件。";
    }

    // 尝试构建日历事件的可读摘要
    const eventSummaries = result.items
      .map((item: any) => {
        let summary = "";

        if (item.summary) {
          summary += `事件: ${item.summary}`;
        }

        if (item.start && (item.start.dateTime || item.start.date)) {
          const startTime = item.start.dateTime || item.start.date;
          summary += ` | 开始时间: ${startTime}`;
        }

        if (item.end && (item.end.dateTime || item.end.date)) {
          const endTime = item.end.dateTime || item.end.date;
          summary += ` | 结束时间: ${endTime}`;
        }

        if (item.location) {
          summary += ` | 地点: ${item.location}`;
        }

        return summary;
      })
      .join("\n");

    return `找到以下日历事件:\n${eventSummaries}`;
  }

  // 如果找不到结构化信息，返回字符串化的结果
  return JSON.stringify(result);
};

// 辅助函数：从工具数据中提取可读文本
const extractTextFromToolData = (data: any): string => {
  if (!data) return "";

  if (data.toolCalls && Array.isArray(data.toolCalls)) {
    let extractedInfo = "正在使用以下工具获取信息:\n";

    data.toolCalls.forEach((call: any, index: number) => {
      if (call.toolName) {
        extractedInfo += `- ${call.toolName}\n`;

        // 如果有工具输出，也显示
        if (call.output) {
          extractedInfo += extractTextFromToolResult(call.output);
        }
      }
    });

    return extractedInfo;
  }

  return "";
};
