import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MessageSquareIcon, FileTextIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "集成设置",
  description: "管理您的第三方服务集成",
};

const prisma = new PrismaClient();

async function getUserServices(email: string) {
  const user = await prisma.users.findUnique({
    where: {
      email: email,
    },
    include: {
      oauth_tokens: true,
    },
  });

  return user?.oauth_tokens || [];
}

export default async function IntegrationsPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const connectedServices = await getUserServices(session.user.email);

  const isSlackConnected = connectedServices.some(
    (service) => service.provider === "slack"
  );

  const isGoogleConnected = connectedServices.some(
    (service) => service.provider === "google"
  );

  const isNotionConnected = connectedServices.some(
    (service) => service.provider === "notion"
  );

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">集成设置</h1>
      <p className="text-muted-foreground mb-10">
        连接您的第三方服务，以便助手可以为您提供更多功能。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Slack 集成 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">Slack</CardTitle>
            {isSlackConnected && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                已连接
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex items-center mb-4">
              <MessageSquareIcon className="h-8 w-8 text-[#4A154B] mr-3" />
              <div>
                <p className="text-sm font-medium">连接您的Slack工作区</p>
                <p className="text-xs text-muted-foreground">
                  发送消息，查看频道等
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {isSlackConnected ? (
              <Button variant="destructive" className="w-full" asChild>
                <a href="/api/auth/oauth/slack/disconnect">断开连接</a>
              </Button>
            ) : (
              <Button
                className="w-full bg-[#4A154B] hover:bg-[#3a1039]"
                asChild
              >
                <a href="/api/auth/oauth/slack">连接Slack</a>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Google Calendar 集成 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">Google Calendar</CardTitle>
            {isGoogleConnected && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                已连接
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex items-center mb-4">
              <CalendarIcon className="h-8 w-8 text-[#4285F4] mr-3" />
              <div>
                <p className="text-sm font-medium">连接您的Google日历</p>
                <p className="text-xs text-muted-foreground">
                  查看和创建日历事件
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {isGoogleConnected ? (
              <Button variant="destructive" className="w-full" asChild>
                <a href="/api/auth/oauth/google/disconnect">断开连接</a>
              </Button>
            ) : (
              <Button
                className="w-full bg-[#4285F4] hover:bg-[#3367d6]"
                asChild
              >
                <a href="/api/auth/oauth/google">连接Google</a>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Notion 集成 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">Notion</CardTitle>
            {isNotionConnected && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                已连接
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex items-center mb-4">
              <FileTextIcon className="h-8 w-8 text-black mr-3" />
              <div>
                <p className="text-sm font-medium">连接您的Notion工作区</p>
                <p className="text-xs text-muted-foreground">
                  查看和创建Notion页面和数据库
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {isNotionConnected ? (
              <Button variant="destructive" className="w-full" asChild>
                <a href="/api/auth/oauth/notion/disconnect">断开连接</a>
              </Button>
            ) : (
              <Button className="w-full" asChild>
                <a href="/api/auth/oauth/notion">连接Notion</a>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
