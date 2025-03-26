"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SendHorizontal } from "lucide-react"

interface ChatScreenProps {
  onScreenChange: (screen: "dashboard" | "chat" | "insights") => void
}

export function ChatScreen({ onScreenChange }: ChatScreenProps) {
  const [messages, setMessages] = useState([
    {
      type: "system",
      content: "Welcome to MCP Assistant. How can I help you today?",
    },
    {
      type: "user",
      content: "Show me my calendar for tomorrow",
    },
    {
      type: "assistant",
      content: "Here's your schedule for tomorrow:",
      calendar: [
        { time: "09:00 - 09:30", title: "Weekly Team Sync" },
        { time: "11:00 - 12:00", title: "Client Meeting - ABC Corp" },
        { time: "15:00 - 16:00", title: "Product Planning" },
      ],
    },
  ])

  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    setMessages([...messages, { type: "user", content: inputValue }])
    setInputValue("")

    // Simulate assistant response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "I'm processing your request. I'll get back to you shortly.",
        },
      ])
    }, 1000)
  }

  return (
    <section id="chat-screen" className="min-h-screen flex flex-col">
      <AppHeader activeScreen="chat" onScreenChange={onScreenChange} />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-72 border-r bg-background p-6 hidden md:block">
          <h3 className="font-semibold mb-4">Suggested Prompts</h3>
          <ul className="space-y-2">
            <li className="p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
              Summarize my unread Slack messages
            </li>
            <li className="p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
              Find free meeting times next week
            </li>
            <li className="p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
              Show me my GitHub PRs waiting for review
            </li>
            <li className="p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
              Create a summary of yesterday's team meeting
            </li>
            <li className="p-3 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors">
              Draft an email to the design team about the new feature
            </li>
          </ul>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-4 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                {message.type !== "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{message.type === "system" ? "S" : "A"}</AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.type === "system"
                        ? "bg-muted"
                        : "bg-background border"
                  }`}
                >
                  {message.content}

                  {message.type === "assistant" && message.calendar && (
                    <div className="mt-4 bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Tomorrow's Schedule</h4>
                      <ul className="space-y-2">
                        {message.calendar.map((event, idx) => (
                          <li key={idx} className="flex">
                            <span className="w-32 font-medium">{event.time}</span>
                            <span>{event.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {message.type === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t bg-background">
            <div className="max-w-2xl mx-auto relative">
              <Textarea
                placeholder="Ask anything about your connected tools..."
                className="pr-12 min-h-[50px] resize-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button
                size="icon"
                className="absolute right-3 top-3 h-8 w-8"
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
              >
                <SendHorizontal className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              ChatGPT can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

