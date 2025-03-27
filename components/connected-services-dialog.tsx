"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slack, FileText, Mail } from "lucide-react";
import { useSession } from "next-auth/react";

interface ConnectedServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ServiceInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  lastSync?: string;
  authUrl: string;
}

export function ConnectedServicesDialog({
  open,
  onOpenChange,
}: ConnectedServicesDialogProps) {
  const { data: session } = useSession();
  const [services, setServices] = useState<ServiceInfo[]>([
    {
      id: "slack",
      name: "Slack",
      icon: <Slack className="h-5 w-5 text-white" />,
      description:
        "Connect to your Slack workspace to access messages and channels",
      connected: false,
      authUrl: "/api/auth/oauth/slack",
    },
    {
      id: "google",
      name: "Google",
      icon: <Mail className="h-5 w-5 text-white" />,
      description: "Connect to Gmail, Google Calendar, and Google Drive",
      connected: false,
      authUrl: "/api/auth/oauth/google",
    },
    {
      id: "notion",
      name: "Notion",
      icon: <FileText className="h-5 w-5 text-white" />,
      description:
        "Connect to your Notion workspace for documents and databases",
      connected: false,
      authUrl: "/api/auth/oauth/notion",
    },
  ]);

  // 获取用户的已连接服务
  useEffect(() => {
    if (session?.user?.id) {
      fetchConnectedServices();
    }
  }, [session]);

  const fetchConnectedServices = async () => {
    try {
      const response = await fetch(`/api/user/services`);
      if (response.ok) {
        const data = await response.json();

        setServices((prev) =>
          prev.map((service) => {
            const connectedService = data.find(
              (s: any) => s.provider === service.id
            );
            if (connectedService) {
              return {
                ...service,
                connected: true,
                lastSync: new Date(
                  connectedService.updated_at
                ).toLocaleString(),
              };
            }
            return service;
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch connected services:", error);
    }
  };

  const getIconBackground = (id: string) => {
    const colors: Record<string, string> = {
      slack: "bg-[#4A154B]",
      google: "bg-[#4285F4]",
      notion: "bg-black",
    };
    return colors[id] || "bg-gray-700";
  };

  const handleDisconnectService = async (id: string) => {
    try {
      const response = await fetch(`/api/auth/oauth/${id}/disconnect`, {
        method: "DELETE",
      });

      if (response.ok) {
        setServices((prev) =>
          prev.map((service) =>
            service.id === id
              ? {
                  ...service,
                  connected: false,
                  lastSync: undefined,
                }
              : service
          )
        );
      } else {
        console.error(`Failed to disconnect ${id}`);
      }
    } catch (error) {
      console.error(`Error disconnecting ${id}:`, error);
    }
  };

  const handleConnect = (service: ServiceInfo) => {
    // 打开OAuth认证窗口
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const authWindow = window.open(
      service.authUrl,
      `Connect to ${service.name}`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // 不再通过窗口关闭检测来刷新状态，而是通过postMessage接收通知
  };

  // 添加消息事件监听器，处理OAuth回调
  useEffect(() => {
    const handleOAuthCallback = (event: MessageEvent) => {
      // 验证消息类型
      if (event.data?.type === "OAUTH_CALLBACK") {
        // 获取服务提供商和授权结果
        const { provider, success } = event.data;

        // 如果授权成功，刷新连接状态
        if (success) {
          fetchConnectedServices();
        }
      }
    };

    // 添加消息事件监听器
    window.addEventListener("message", handleOAuthCallback);

    // 清理监听器
    return () => {
      window.removeEventListener("message", handleOAuthCallback);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connected Services</DialogTitle>
          <DialogDescription>
            Manage your connected services and integrations
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-md ${getIconBackground(
                        service.id
                      )}`}
                    >
                      {service.icon}
                    </div>
                    <CardTitle className="text-base">{service.name}</CardTitle>
                  </div>
                  {service.connected && (
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20"
                    >
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <CardDescription>{service.description}</CardDescription>
                {service.connected && service.lastSync && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last synced: {service.lastSync}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end pt-2">
                {service.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectService(service.id)}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(service)}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
