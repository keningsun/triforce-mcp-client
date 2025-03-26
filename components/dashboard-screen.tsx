import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Code, MessageSquare, Newspaper } from "lucide-react"

interface DashboardScreenProps {
  onScreenChange: (screen: "dashboard" | "chat" | "insights") => void
}

export function DashboardScreen({ onScreenChange }: DashboardScreenProps) {
  return (
    <section id="dashboard-screen" className="min-h-screen flex flex-col">
      <AppHeader activeScreen="dashboard" onScreenChange={onScreenChange} />

      <div className="flex-1 p-6 bg-muted/40 flex flex-col gap-6">
        <div className="bg-background rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Welcome to MCP Internal Tool</h2>
          <p className="text-muted-foreground">Your connected workplace assistant</p>
        </div>

        <div className="bg-background rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <Newspaper className="h-6 w-6 text-primary" />
              <span>Daily Summary</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <Calendar className="h-6 w-6 text-primary" />
              <span>Schedule Meeting</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span>Important Messages</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <Code className="h-6 w-6 text-primary" />
              <span>Code Updates</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Email Summary</CardTitle>
              <Badge>5 unread</Badge>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="py-2 border-b relative pl-3">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <div className="font-medium">Product Team</div>
                  <div className="text-muted-foreground">Weekly Sprint Update</div>
                </li>
                <li className="py-2 border-b relative pl-3">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <div className="font-medium">HR Department</div>
                  <div className="text-muted-foreground">Company All-hands Meeting</div>
                </li>
                <li className="py-2">
                  <div className="font-medium">John Smith</div>
                  <div className="text-muted-foreground">Project Timeline Discussion</div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="py-2 border-b">
                  <div className="font-medium">09:00 - 09:30</div>
                  <div className="text-muted-foreground">Daily Standup</div>
                </li>
                <li className="py-2 border-b bg-primary/5 border-l-2 border-l-primary pl-3">
                  <div className="font-medium">11:00 - 12:00</div>
                  <div className="text-muted-foreground">Product Review</div>
                </li>
                <li className="py-2">
                  <div className="font-medium">14:00 - 15:00</div>
                  <div className="text-muted-foreground">Planning Session</div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

