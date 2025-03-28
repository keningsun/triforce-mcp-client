import { NextResponse } from "next/server";

// 定义可用的服务列表
const services = [
  {
    id: "google",
    name: "Google",
    description: "Connect to Gmail, Google Calendar, and Google Drive",
    logo: "/logos/google.svg",
  },
  {
    id: "slack",
    name: "Slack",
    description:
      "Connect to your Slack workspace to access messages and channels",
    logo: "/logos/slack.svg",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Connect to your Notion workspace for documents and databases",
    logo: "/logos/notion.svg",
  },
];

export async function GET() {
  return NextResponse.json(services);
}

// 添加导出配置，明确标记为动态路由
export const dynamic = "force-dynamic";
