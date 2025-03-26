"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Mail, Slack, Database, FileText, Cloud } from "lucide-react"

interface ConnectedServicesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ServiceInfo {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  connected: boolean
  lastSync?: string
}

export function ConnectedServicesDialog({ open, onOpenChange }: ConnectedServicesDialogProps) {
  const [services, setServices] = useState<ServiceInfo[]>([
    {
      id: "slack",
      name: "Slack",
      icon: <Slack className="h-5 w-5 text-white" />,
      description: "Connect to your Slack workspace to access messages and channels",
      connected: true,
      lastSync: "2 hours ago",
    },
    {
      id: "github",
      name: "GitHub",
      icon: <Github className="h-5 w-5 text-white" />,
      description: "Access repositories, pull requests, and issues",
      connected: true,
      lastSync: "30 minutes ago",
    },
    {
      id: "google",
      name: "Google",
      icon: <Mail className="h-5 w-5 text-[#4285F4]" />,
      description: "Connect to Gmail, Google Calendar, and Google Drive",
      connected: false,
    },
    {
      id: "jira",
      name: "Jira",
      icon: <FileText className="h-5 w-5 text-white" />,
      description: "Access your Jira projects, issues, and sprints",
      connected: false,
    },
    {
      id: "notion",
      name: "Notion",
      icon: <FileText className="h-5 w-5 text-white" />,
      description: "Connect to your Notion workspace for documents and databases",
      connected: false,
    },
    {
      id: "figma",
      name: "Figma",
      icon: <FileText className="h-5 w-5 text-white" />,
      description: "Access your Figma designs and prototypes",
      connected: false,
    },
    {
      id: "aws",
      name: "AWS",
      icon: <Cloud className="h-5 w-5 text-white" />,
      description: "Connect to your AWS services and resources",
      connected: false,
    },
    {
      id: "azure",
      name: "Azure",
      icon: <Cloud className="h-5 w-5 text-white" />,
      description: "Access your Azure services and resources",
      connected: false,
    },
    {
      id: "mongodb",
      name: "MongoDB",
      icon: <Database className="h-5 w-5 text-white" />,
      description: "Connect to your MongoDB databases",
      connected: false,
    },
    {
      id: "postgresql",
      name: "PostgreSQL",
      icon: <Database className="h-5 w-5 text-white" />,
      description: "Connect to your PostgreSQL databases",
      connected: false,
    },
  ])

  const getIconBackground = (id: string) => {
    const colors: Record<string, string> = {
      slack: "bg-[#4A154B]",
      github: "bg-[#24292e]",
      google: "bg-white border",
      jira: "bg-[#0052CC]",
      notion: "bg-black",
      figma: "bg-[#F24E1E]",
      aws: "bg-[#232F3E]",
      azure: "bg-[#0078D4]",
      mongodb: "bg-[#13AA52]",
      postgresql: "bg-[#336791]",
    }
    return colors[id] || "bg-gray-700"
  }

  const handleToggleService = (id: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id
          ? {
              ...service,
              connected: !service.connected,
              lastSync: !service.connected ? "Just now" : undefined,
            }
          : service,
      ),
    )
  }

  const handleConnect = (id: string) => {
    // Simulate OAuth flow
    setTimeout(() => {
      setServices((prev) =>
        prev.map((service) =>
          service.id === id
            ? {
                ...service,
                connected: true,
                lastSync: "Just now",
              }
            : service,
        ),
      )
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connected Services</DialogTitle>
          <DialogDescription>Manage your connected services and integrations</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${getIconBackground(service.id)}`}>{service.icon}</div>
                    <CardTitle className="text-base">{service.name}</CardTitle>
                  </div>
                  {service.connected && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <CardDescription>{service.description}</CardDescription>
                {service.connected && service.lastSync && (
                  <p className="text-xs text-muted-foreground mt-1">Last synced: {service.lastSync}</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end pt-2">
                {service.connected ? (
                  <Switch
                    id={`${service.id}-toggle`}
                    checked={service.connected}
                    onCheckedChange={() => handleToggleService(service.id)}
                  />
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(service.id)}
                    className="bg-[#1E6B68] hover:bg-[#1E6B68]/90"
                  >
                    Connect
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onOpenChange(false)} className="bg-[#1E6B68] hover:bg-[#1E6B68]/90">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

