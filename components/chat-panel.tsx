"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { TriforceIcon } from "./triforce-icon"

type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

type SuggestedPrompt = {
  text: string
  icon: React.ReactNode
}

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
]

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "system",
      content: "Welcome to Triforce. How can I help you today?",
      timestamp: new Date(),
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = (content: string = input) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm processing your request. Here's what I found based on your connected services...",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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
              {message.content}
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
                onClick={() => handleSend(prompt.text)}
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            style={{ backgroundColor: "#1E6B68" }}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

