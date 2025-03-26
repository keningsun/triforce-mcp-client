"use client"

import { Button } from "@/components/ui/button"
import { Github, Slack, Mail } from "lucide-react"

interface AuthScreenProps {
  connectedServices: {
    slack: boolean
    github: boolean
    google: boolean
  }
  onServiceConnect: (service: "slack" | "github" | "google") => void
  onStartApp: () => void
}

export function AuthScreen({ connectedServices, onServiceConnect, onStartApp }: AuthScreenProps) {
  const isAnyServiceConnected = Object.values(connectedServices).some(Boolean)

  return (
    <section id="auth-screen" className="min-h-screen flex items-center justify-center p-4">
      <div className="auth-container max-w-md w-full bg-background rounded-lg shadow-md p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">MCP</span>
          </div>
          <h1 className="text-2xl font-bold">Internal Tool</h1>
        </div>

        <p className="text-center text-muted-foreground">Connect your work tools and boost productivity</p>

        <div className="w-full flex flex-col gap-4">
          <Button
            variant={connectedServices.slack ? "default" : "outline"}
            className={`w-full justify-start gap-3 h-12 ${
              connectedServices.slack ? "bg-green-600 hover:bg-green-700" : ""
            }`}
            onClick={() => onServiceConnect("slack")}
          >
            <Slack className="h-5 w-5" />
            <span>{connectedServices.slack ? "Slack Connected" : "Connect Slack"}</span>
          </Button>

          <Button
            variant={connectedServices.github ? "default" : "outline"}
            className={`w-full justify-start gap-3 h-12 ${
              connectedServices.github ? "bg-green-600 hover:bg-green-700" : ""
            }`}
            onClick={() => onServiceConnect("github")}
          >
            <Github className="h-5 w-5" />
            <span>{connectedServices.github ? "GitHub Connected" : "Connect GitHub"}</span>
          </Button>

          <Button
            variant={connectedServices.google ? "default" : "outline"}
            className={`w-full justify-start gap-3 h-12 ${
              connectedServices.google ? "bg-green-600 hover:bg-green-700" : ""
            }`}
            onClick={() => onServiceConnect("google")}
          >
            <Mail className="h-5 w-5" />
            <span>{connectedServices.google ? "Google Connected" : "Connect Google (Calendar, Gmail)"}</span>
          </Button>
        </div>

        <Button className="w-full h-12 mt-4" disabled={!isAnyServiceConnected} onClick={onStartApp}>
          Get Started
        </Button>
      </div>
    </section>
  )
}

