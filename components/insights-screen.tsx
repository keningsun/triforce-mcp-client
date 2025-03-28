import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, MessageSquare, Mail, Video, FileText } from "lucide-react";

interface InsightsScreenProps {
  onScreenChange: (screen: "dashboard" | "chat" | "insights") => void;
}

export function InsightsScreen({ onScreenChange }: InsightsScreenProps) {
  return (
    <section id="insights-screen" className="min-h-screen flex flex-col">
      <AppHeader activeScreen="insights" onScreenChange={onScreenChange} />

      <div className="flex-1 p-6 bg-muted/40">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Work Insights</h2>

          <div className="flex gap-2">
            <Button variant="outline" className="bg-background">
              Week
            </Button>
            <Button variant="outline" className="bg-background">
              Month
            </Button>
            <Button variant="outline" className="bg-background">
              Quarter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Allocation</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="relative w-40 h-40 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-primary"
                  style={{
                    clipPath:
                      "polygon(50% 50%, 0 0, 0 100%, 100% 100%, 100% 0)",
                  }}
                ></div>
                <div
                  className="absolute inset-0 bg-green-500"
                  style={{ clipPath: "polygon(50% 50%, 100% 0, 0 0)" }}
                ></div>
                <div
                  className="absolute inset-0 bg-yellow-500"
                  style={{ clipPath: "polygon(50% 50%, 0 0, 0 50%)" }}
                ></div>
                <div
                  className="absolute inset-0 bg-red-500"
                  style={{
                    clipPath: "polygon(50% 50%, 0 50%, 0 100%, 25% 100%)",
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-background"></div>
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-6 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>45% Meetings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>30% Development</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>15% Communication</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>10% Other</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productivity Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-primary">7.8</div>
              <div className="text-sm text-muted-foreground">out of 10</div>
              <div className="flex items-center gap-1 text-green-500 mt-2">
                <ArrowUp className="h-4 w-4" />
                <span>+0.6 from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notion Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-40 px-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary w-10 h-[30%] rounded-t-md"></div>
                  <span className="text-xs">Mon</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary w-10 h-[60%] rounded-t-md"></div>
                  <span className="text-xs">Tue</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary w-10 h-[40%] rounded-t-md"></div>
                  <span className="text-xs">Wed</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary w-10 h-[90%] rounded-t-md"></div>
                  <span className="text-xs">Thu</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary w-10 h-[50%] rounded-t-md"></div>
                  <span className="text-xs">Fri</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Slack</span>
                  </div>
                  <span>65%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <span>20%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: "20%" }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span>Video Calls</span>
                  </div>
                  <span>15%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: "15%" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
