"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SendHorizontal,
  Sparkles,
  Bot,
  User,
  Calendar,
  MessageSquare,
  Github,
  FileText,
  Clock,
  Lightbulb,
  Code,
  AlertCircle,
} from "lucide-react";
import { TriforceIcon } from "./triforce-icon";
import { useMCPChat } from "@/lib/hooks/use-mcp-chat";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkdownRenderer } from "./markdown-renderer";

type SuggestedPrompt = {
  text: string;
  icon: React.ReactNode;
};

const suggestedPrompts: SuggestedPrompt[] = [
  {
    text: "Summarize my unread Slack messages",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    text: "What meetings do I have today?",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    text: "Show me my pending GitHub PRs",
    icon: <Github className="h-4 w-4" />,
  },
  {
    text: "What are my top priorities for today?",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    text: "Draft an email to the team about the project status",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    text: "Find time for a meeting with the design team next week",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    text: "Help me debug this authentication issue",
    icon: <Code className="h-4 w-4" />,
  },
  {
    text: "Suggest ways to improve our API performance",
    icon: <Lightbulb className="h-4 w-4" />,
  },
];

export function ChatPanel() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "demo-user";

  // 使用我们的MCP聊天hook
  const {
    messages,
    input,
    handleInputChange,
    handleSendMessage,
    isLoading,
    error,
    toolData,
    extractedContent,
  } = useMCPChat({
    userId,
    initialMessages: [
      {
        id: "1",
        role: "system",
        content: "Welcome to Triforce. How can I help you today?",
        timestamp: new Date(),
      },
    ],
  });

  console.log("Current userId for MCP:", userId);
  console.log("Extracted content:", extractedContent);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role !== "user" && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#1E6B68] flex items-center justify-center">
                {message.role === "system" ? (
                  <div className="w-5 h-5">
                    <TriforceIcon color="white" />
                  </div>
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-[#1E6B68] text-white"
                  : message.role === "system"
                  ? "bg-muted"
                  : "bg-background border"
              }`}
            >
              {message.content === "" && message.role === "assistant" ? (
                <div className="text-muted-foreground">
                  {extractedContent ? (
                    // 显示从数据流中提取的内容
                    <div>{extractedContent}</div>
                  ) : (
                    <>
                      <div className="mb-2 font-medium">
                        Working on your request...
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Clock className="h-4 w-4" />
                        <span>Using tools to find information</span>
                      </div>

                      {toolData && (
                        <div className="mt-2 border-t pt-2 text-xs">
                          <div className="font-medium mb-1">
                            Raw Data Stream:
                          </div>
                          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
                            {JSON.stringify(toolData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : message.role === "assistant" ? (
                <MarkdownRenderer content={message.content} />
              ) : (
                message.content
              )}
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#1E6B68] flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="max-w-[80%] rounded-lg p-3 bg-background border">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        {/* Suggested Prompts Section */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[#1E6B68]" />
            <h3 className="text-sm font-medium">Suggested Prompts</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full bg-muted/50 hover:bg-muted"
                onClick={() => {
                  // 模拟在文本框中输入内容
                  const textarea = document.querySelector("textarea");
                  if (textarea) {
                    // 获取原生处理函数
                    const nativeInputValueSetter =
                      Object.getOwnPropertyDescriptor(
                        window.HTMLTextAreaElement.prototype,
                        "value"
                      )?.set;

                    if (nativeInputValueSetter) {
                      nativeInputValueSetter.call(textarea, prompt.text);

                      // 触发输入事件
                      textarea.dispatchEvent(
                        new Event("input", { bubbles: true })
                      );

                      // 触发提交
                      setTimeout(() => handleSendMessage(prompt.text), 10);
                    } else {
                      // 回退方案
                      handleSendMessage(prompt.text);
                    }
                  } else {
                    // 回退方案
                    handleSendMessage(prompt.text);
                  }
                }}
                disabled={isLoading}
              >
                {prompt.icon}
                <span className="text-xs">{prompt.text}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Ask a question..."
            className="min-h-[60px] resize-none"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            style={{ backgroundColor: "#1E6B68" }}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
