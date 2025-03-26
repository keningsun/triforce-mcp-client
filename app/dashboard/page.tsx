"use client"
import { AppHeader } from "@/components/app-header"
import { ChatPanel } from "@/components/chat-panel"
import { InfoPanel } from "@/components/info-panel"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

export default function DashboardPage() {
  return (
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
  )
}

