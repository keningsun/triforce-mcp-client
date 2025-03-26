"use client";
import { AppHeader } from "@/components/app-header";
import { ChatPanel } from "@/components/chat-panel";
import { InfoPanel } from "@/components/info-panel";
import { ProtectedRoute } from "@/components/protected-route";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col">
        <AppHeader />

        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={45} minSize={30}>
              <InfoPanel />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={55} minSize={40}>
              <ChatPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </ProtectedRoute>
  );
}
