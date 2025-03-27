import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

interface UseMCPChatProps {
  userId: string;
  initialMessages?: Message[];
}

export function useMCPChat({ userId, initialMessages = [] }: UseMCPChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 使用useCompletion替代useChat，API更简单且适合我们的用例
  const { complete, completion, isLoading } = useCompletion({
    api: "/api/chat",
    body: {
      userId,
    },
    onResponse: (response) => {
      // 检查响应状态
      if (!response.ok) {
        console.error(
          "API response not OK:",
          response.status,
          response.statusText
        );
        setError(`服务器错误: ${response.status} ${response.statusText}`);
      } else {
        setError(null);

        // 如果是JSON响应（非流式），则处理它
        if (
          response.headers.get("Content-Type")?.includes("application/json")
        ) {
          response
            .json()
            .then((data) => {
              if (data.error) {
                setError(data.error);
                return;
              }

              if (data.text) {
                // 添加助手消息到对话历史
                const assistantMessage: Message = {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: data.text,
                  timestamp: new Date(),
                };

                setMessages((prev) => [...prev, assistantMessage]);
              }
            })
            .catch((err) => {
              console.error("Error parsing JSON response:", err);
            });
        }
      }
    },
    onFinish: (completion) => {
      console.log(
        "Completion received:",
        completion ? completion.substring(0, 50) + "..." : "empty"
      );

      // 只处理流式响应的完成回调（如果是JSON响应，我们已经在onResponse中处理了）
      if (completion && completion.trim() && !completion.startsWith("{")) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: completion,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    },
    onError: (error) => {
      console.error("Completion error:", error);
      setError(error.message);

      // 添加错误消息到对话
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `发生错误: ${error.message}。请稍后重试或联系支持团队。`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // 处理发送消息
  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim() || isLoading) return;

    // 重置错误状态
    setError(null);

    // 添加用户消息到对话历史
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue(""); // 清空输入框

    try {
      console.log("Sending message to API:", content.substring(0, 50) + "...");
      // 调用AI API，确保传递正确的参数
      // complete方法会将文本作为prompt参数发送
      await complete(content);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(`发送消息错误: ${error.message}`);

      // 添加错误消息到对话
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `消息发送失败: ${error.message}。请检查您的网络连接并重试。`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return {
    messages,
    input: inputValue,
    handleInputChange,
    handleSendMessage,
    isLoading,
    error,
  };
}
