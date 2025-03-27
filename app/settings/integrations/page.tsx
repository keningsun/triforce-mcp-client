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
  title: "Integration Settings",
  description: "Manage your third-party service integrations",
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
      <h1 className="text-3xl font-bold mb-6">Integration Settings</h1>
      <p className="text-muted-foreground mb-10">
        Connect your third-party services to enable more features for your
        assistant.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Slack 集成 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">Slack</CardTitle>
            {isSlackConnected && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex items-center mb-4">
              <MessageSquareIcon className="h-8 w-8 text-[#4A154B] mr-3" />
              <div>
                <p className="text-sm font-medium">
                  Connect your Slack workspace
                </p>
                <p className="text-xs text-muted-foreground">
                  Send messages, view channels, etc.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {isSlackConnected ? (
              <Button variant="destructive" className="w-full" asChild>
                <a href="/api/auth/oauth/slack/disconnect">Disconnect</a>
              </Button>
            ) : (
              <Button
                className="w-full bg-[#4A154B] hover:bg-[#3a1039]"
                asChild
              >
                <a href="/api/auth/oauth/slack">Connect Slack</a>
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
                Connected
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex items-center mb-4">
              <CalendarIcon className="h-8 w-8 text-[#4285F4] mr-3" />
              <div>
                <p className="text-sm font-medium">
                  Connect your Google Calendar
                </p>
                <p className="text-xs text-muted-foreground">
                  View and create calendar events
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {isGoogleConnected ? (
              <Button variant="destructive" className="w-full" asChild>
                <a href="/api/auth/oauth/google/disconnect">Disconnect</a>
              </Button>
            ) : (
              <Button
                className="w-full bg-[#4285F4] hover:bg-[#3367d6]"
                asChild
              >
                <a href="/api/auth/oauth/google">Connect Google</a>
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
                Connected
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex items-center mb-4">
              <FileTextIcon className="h-8 w-8 text-black mr-3" />
              <div>
                <p className="text-sm font-medium">
                  Connect your Notion workspace
                </p>
                <p className="text-xs text-muted-foreground">
                  View and create Notion pages and databases
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {isNotionConnected ? (
              <Button variant="destructive" className="w-full" asChild>
                <a href="/api/auth/oauth/notion/disconnect">Disconnect</a>
              </Button>
            ) : (
              <Button className="w-full" asChild>
                <a href="/api/auth/oauth/notion">Connect Notion</a>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
