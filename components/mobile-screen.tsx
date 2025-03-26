"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Menu, Send, Zap, Calendar, ChevronDown } from "lucide-react"

export function MobileScreen() {
  const [activeView, setActiveView] = useState<"home" | "chat" | "insights" | "settings">("home")

  return (
    <div className="w-full max-w-md mx-auto border-[10px] border-gray-800 rounded-[30px] overflow-hidden h-[85vh] flex flex-col bg-background">
      <header className="p-4 flex justify-between items-center border-b">
        <div className="text-xl font-bold text-primary">MCP</div>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex border-b overflow-x-auto scrollbar-hide">
        <button
          className={`px-4 py-3 whitespace-nowrap ${
            activeView === "home" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveView("home")}
        >
          Home
        </button>
        <button
          className={`px-4 py-3 whitespace-nowrap ${
            activeView === "chat" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveView("chat")}
        >
          Chat
        </button>
        <button
          className={`px-4 py-3 whitespace-nowrap ${
            activeView === "insights" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveView("insights")}
        >
          Insights
        </button>
        <button
          className={`px-4 py-3 whitespace-nowrap ${
            activeView === "settings" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
          }`}
          onClick={() => setActiveView("settings")}
        >
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeView === "home" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Hello, User</h2>
              <p className="text-muted-foreground">Today's Overview</p>
            </div>

            <Card className="bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <h3 className="font-semibold">Upcoming</h3>
                <Badge variant="outline">Next 2 hours</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div>
                  <div className="font-medium">11:00 - 12:00</div>
                  <div className="text-muted-foreground">Product Review</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                <h3 className="font-semibold">Messages</h3>
                <Badge variant="outline">3 new</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div>
                  <div className="font-medium">Alex from Design</div>
                  <div className="text-muted-foreground">Updated mockups are ready for review</div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button className="h-auto py-3 flex flex-col items-center gap-2">
                <Zap className="h-5 w-5" />
                <span>Quick Summary</span>
              </Button>
              <Button className="h-auto py-3 flex flex-col items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Schedule</span>
              </Button>
            </div>
          </div>
        )}

        {activeView === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 mb-4">
              <div className="bg-muted p-3 rounded-lg max-w-[85%] mx-auto">
                <p>How can I help you today?</p>
              </div>

              <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[85%] ml-auto">
                <p>Summarize my day</p>
              </div>

              <div className="bg-muted p-3 rounded-lg max-w-[85%]">
                <p>You have 3 meetings today, 5 unread emails, and 2 GitHub PRs waiting for your review.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Input placeholder="Ask anything..." className="flex-1" />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {activeView === "insights" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Weekly Insights</h3>

            <Card>
              <CardHeader className="pb-2">
                <h4 className="font-medium">Time Allocation</h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>45% Meetings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>30% Coding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>25% Other</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === "settings" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch id="dark-mode" />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Notifications</Label>
                <Switch id="notifications" defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span>Connected Services</span>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

