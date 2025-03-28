"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ListTodo,
  X,
  MessageSquare,
  Github,
  Calendar,
  Mail,
  FileText,
  Code,
  AlertCircle,
  Lightbulb,
  Plus,
  GripVertical,
  Edit2,
  ArrowRight,
  Database,
  Bookmark,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * InfoPanel Component
 *
 * This component displays two main sections:
 * 1. Activity Insights - Shows insights generated from connected services data
 * 2. Action Items - Displays a list of tasks with drag-and-drop reordering
 *
 * The component maintains independent scrolling for each section and uses a 6:4 ratio
 * to allocate more space to the Activity Insights section.
 */

/**
 * Type Definitions
 *
 * These interfaces define the data structure for Activity Insights and Action Items
 */
interface ActivityItem {
  id: string;
  text: string;
  time?: string;
  link?: string;
  linkText?: string;
  priority?: "high" | "medium" | "low";
}

interface ActivitySection {
  title: string;
  icon: React.ReactNode;
  items: ActivityItem[];
}

interface ActivityInsight {
  id: string;
  timestamp: string;
  summary: string;
  details: ActivitySection[];
  recommendations: string[];
}

interface ActionItem {
  id: string;
  text: string;
  prompt: string;
  completed: boolean;
  priority?: "high" | "medium" | "low";
}

/**
 * Utility Functions
 */

// Format timestamp to show date and time without year
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * SortableActionItem Component
 *
 * A draggable action item that displays:
 * - Drag handle for reordering
 * - Checkbox for completion status
 * - Editable text field
 * - "Go" button that triggers the associated prompt
 *
 * Features:
 * - Inline editing of action text
 * - Visual indication for high priority items
 * - Different styling for completed items
 */
// Sortable Action Item component
function SortableActionItem({
  action,
  toggleCompleted,
  handlePromptAction,
  updateActionText,
}: {
  action: ActionItem;
  toggleCompleted: (id: string) => void;
  handlePromptAction: (prompt: string) => void;
  updateActionText: (id: string, text: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(action.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const saveEdit = () => {
    updateActionText(action.id, editText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      setEditText(action.text);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 border rounded-md h-[50px]",
        action.completed ? "bg-muted/50" : "",
        action.priority === "high" && !action.completed
          ? "border-l-4 border-l-amber-500"
          : ""
      )}
    >
      <div
        className="cursor-grab touch-none flex items-center h-full px-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <Checkbox
        id={`action-${action.id}`}
        checked={action.completed}
        onCheckedChange={() => toggleCompleted(action.id)}
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0 flex items-center gap-2">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs"
          />
        ) : (
          <>
            <label
              htmlFor={`action-${action.id}`}
              className={cn(
                "text-xs font-medium cursor-pointer truncate flex-1",
                action.completed ? "line-through text-muted-foreground" : ""
              )}
            >
              {action.text}
            </label>

            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={startEditing}
            >
              <Edit2 className="h-3 w-3 text-muted-foreground" />
              <span className="sr-only">Edit</span>
            </Button>
          </>
        )}
      </div>

      {!action.completed && (
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0 border-[#1E6B68] text-[#1E6B68] hover:bg-[#1E6B68]/10"
          onClick={() => handlePromptAction(action.prompt)}
          title="Go"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="sr-only">Go</span>
        </Button>
      )}
    </div>
  );
}

/**
 * Main InfoPanel Component
 *
 * Manages the state and layout for both Activity Insights and Action Items.
 * Provides functionality for:
 * - Generating new insights
 * - Removing insights
 * - Adding new actions
 * - Completing actions
 * - Reordering actions via drag and drop
 * - Editing action text
 */
export function InfoPanel() {
  const [activityInsights, setActivityInsights] = useState<ActivityInsight[]>(
    []
  );
  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: "action1",
      text: "Review PR #342 from Sarah about responsive design",
      prompt:
        "Remind me what I need to look for in Sarah's PR about responsive design",
      completed: false,
      priority: "high",
    },
    {
      id: "action2",
      text: "Prepare for the Product Roadmap meeting at 11:00 AM",
      prompt: "Create talking points for the Product Roadmap meeting",
      completed: false,
      priority: "high",
    },
    {
      id: "action3",
      text: "Investigate password reset issue in production",
      prompt: "Show me details about the password reset issue #156",
      completed: false,
      priority: "high",
    },
    {
      id: "action4",
      text: "Respond to Emma about API changes discussion",
      prompt: "Draft a response to Emma about the API changes discussion",
      completed: false,
    },
    {
      id: "action5",
      text: "Update API documentation for the new endpoints",
      prompt: "Help me document the new API endpoints",
      completed: true,
    },
    {
      id: "action6",
      text: "Prepare for code review meeting at 3:00 PM",
      prompt: "Create a checklist for today's code review meeting at 3:00 PM",
      completed: false,
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize with a default Activity Insight on component mount
  // This ensures users see relevant information immediately upon login
  useEffect(() => {
    if (activityInsights.length === 0) {
      const defaultInsight = generateDevelopmentScenario();
      setActivityInsights([defaultInsight]);
    }
  }, [activityInsights.length]);

  /**
   * Handlers for Activity Insights management
   */
  const generateNewInsight = () => {
    // Generate a random scenario
    const scenarios = [
      generateDevelopmentScenario(),
      generateMeetingHeavyScenario(),
      generateProjectDeadlineScenario(),
      generateBugFixScenario(),
    ];

    const newInsight = scenarios[Math.floor(Math.random() * scenarios.length)];

    // Add the new insight at the beginning of the array
    setActivityInsights((prev) => [newInsight, ...prev]);
  };

  const removeInsight = (id: string) => {
    setActivityInsights((prev) => prev.filter((insight) => insight.id !== id));
  };

  /**
   * Handlers for Action Items management
   */
  const handlePromptAction = (prompt: string) => {
    // This would be connected to the chat panel in a real implementation
    console.log("Action prompt:", prompt);
    // Here you would trigger the chat panel to use this prompt
  };

  const toggleActionCompleted = (id: string) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, completed: !action.completed } : action
      )
    );
  };

  const addNewAction = () => {
    const newAction: ActionItem = {
      id: `action${Date.now()}`,
      text: "New action item",
      prompt: "Help me with this new task",
      completed: false,
    };

    setActions((prev) => [newAction, ...prev]);
  };

  const updateActionText = (id: string, text: string) => {
    setActions((prev) =>
      prev.map((action) => (action.id === id ? { ...action, text } : action))
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  /**
   * Main component layout with 6:4 ratio between Activity Insights and Action Items
   */
  return (
    <div className="h-full flex flex-col">
      {/* Activity Insights Section with its own ScrollArea - 60% of space */}
      <div className="flex-[6] flex flex-col min-h-0">
        {/* Enhanced panel header with better visual distinction */}
        <div className="p-4 pb-2 bg-muted/30 border-b">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-medium flex items-center gap-2">
              <BarChart className="h-4 w-4 text-[#1E6B68]" />
              Activity Insights
            </h4>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={generateNewInsight}
            >
              <BarChart className="h-3 w-3" />
              <span className="text-xs">Generate</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            {activityInsights.map((insight) => (
              <Card key={insight.id} className="relative">
                {/* Card Header - Contains Summary title on left, timestamp and close button on right */}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#1E6B68]" />
                      Summary
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(insight.timestamp)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeInsight(insight.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Close</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Summary Content Section */}
                  <p className="text-sm">{insight.summary}</p>

                  {/* Separator between Summary and Details */}
                  <Separator className="my-2" />

                  {/* Details Section */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Code className="h-4 w-4 text-[#1E6B68]" />
                      Details
                    </h4>
                    <div className="space-y-2">
                      {insight.details.map((section, idx) => (
                        <Collapsible key={idx} className="border rounded-md">
                          <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {section.icon}
                              {section.title}
                            </div>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-3 pb-3">
                            <ul className="space-y-2">
                              {section.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="text-sm">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-start gap-2">
                                        {item.priority === "high" && (
                                          <AlertCircle className="h-3 w-3 text-amber-500 mt-1 flex-shrink-0" />
                                        )}
                                        <span>{item.text}</span>
                                      </div>
                                      {item.time && (
                                        <span className="text-xs text-muted-foreground ml-5">
                                          {item.time}
                                        </span>
                                      )}
                                    </div>
                                    {item.link && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs ml-2"
                                        onClick={() =>
                                          window.open(item.link, "_blank")
                                        }
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        {item.linkText}
                                      </Button>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>

                  {/* Separator between Details and Recommendations */}
                  <Separator className="my-2" />

                  {/* Recommendations Section */}
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-[#1E6B68]" />
                      Recommendations
                    </h4>
                    <ul className="text-sm space-y-2">
                      {insight.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-1 flex-shrink-0 text-[#1E6B68]" />
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Visual separator between sections */}
      <Separator className="my-0" />

      {/* Actions Section with its own ScrollArea - 40% of space */}
      <div className="flex-[4] flex flex-col min-h-0">
        {/* Enhanced panel header with better visual distinction */}
        <div className="p-4 pb-2 bg-muted/30 border-b">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-medium flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-[#1E6B68]" />
              Action Items
            </h4>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={addNewAction}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Action</span>
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={actions.map((action) => action.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {actions.map((action) => (
                  <SortableActionItem
                    key={action.id}
                    action={action}
                    toggleCompleted={toggleActionCompleted}
                    handlePromptAction={handlePromptAction}
                    updateActionText={updateActionText}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </div>
    </div>
  );
}

/**
 * Scenario Generation Functions
 *
 * These functions create realistic activity insight scenarios based on common work patterns:
 * - Development Scenario: Focus on code, PRs, and technical discussions
 * - Meeting Heavy Scenario: Focus on calendar events and communications
 * - Project Deadline Scenario: Focus on tasks, bugs, and upcoming deadlines
 * - Bug Fix Scenario: Focus on incident response and system metrics
 *
 * Each scenario includes:
 * - Summary: Brief overview of the current situation
 * - Details: Categorized information from different services
 * - Recommendations: Actionable suggestions based on the data
 */
// Helper functions to generate realistic scenarios
function generateDevelopmentScenario(): ActivityInsight {
  return {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString(),
    summary:
      "You're in active development mode today with 15 new commits across 3 repositories. There are 4 pull requests awaiting your review, and the team is discussing API changes in Slack. You have a code review meeting at 3:00 PM and the sprint planning is tomorrow morning.",
    details: [
      {
        title: "Notion Workspace",
        icon: <FileText className="h-4 w-4 text-black" />,
        items: [
          {
            id: "notion1",
            text: "API Documentation Updates",
            time: "Updated by Sarah Chen 2 hours ago",
            link: "https://notion.so",
            linkText: "Open",
            priority: "high",
          },
          {
            id: "notion2",
            text: "Authentication Flow Diagrams",
            time: "Updated by Alex Johnson 4 hours ago",
            link: "https://notion.so",
            linkText: "Open",
          },
          {
            id: "notion3",
            text: "Project Timeline",
            time: "Updated by Miguel Santos yesterday",
            link: "https://notion.so",
            linkText: "Open",
          },
          {
            id: "notion4",
            text: "Bug Tracking Database",
            time: "New entry: 'Users unable to reset password in production' 30 minutes ago",
            link: "https://notion.so",
            linkText: "View Database",
            priority: "high",
          },
          {
            id: "notion5",
            text: "Frontend Components Documentation",
            time: "You updated this page 45 minutes ago",
            link: "https://notion.so",
            linkText: "Continue Editing",
          },
        ],
      },
      {
        title: "Slack Messages",
        icon: <MessageSquare className="h-4 w-4 text-[#4A154B]" />,
        items: [
          {
            id: "sl1",
            text: "@you mentioned in #api-team: 'Can you review the authentication changes?'",
            time: "From: David Kim 15 minutes ago",
            link: "https://slack.com",
            linkText: "Open Thread",
          },
          {
            id: "sl2",
            text: "Direct message: 'Are you available for a quick call about the API changes?'",
            time: "From: Emma Wilson 30 minutes ago",
            link: "https://slack.com",
            linkText: "Reply",
          },
          {
            id: "sl3",
            text: "#frontend-team has 24 unread messages",
            time: "Most recent activity: 5 minutes ago",
            link: "https://slack.com",
            linkText: "Open Channel",
          },
          {
            id: "sl4",
            text: "#general announcement: 'New security policy effective next week'",
            time: "From: IT Security 2 hours ago",
            link: "https://slack.com",
            linkText: "Read More",
          },
        ],
      },
      {
        title: "Calendar Events",
        icon: <Calendar className="h-4 w-4 text-[#4285F4]" />,
        items: [
          {
            id: "cal1",
            text: "Code Review Meeting",
            time: "Today, 3:00 PM - 4:00 PM",
            link: "https://calendar.google.com",
            linkText: "Join",
          },
          {
            id: "cal2",
            text: "Sprint Planning",
            time: "Tomorrow, 10:00 AM - 11:30 AM",
            link: "https://calendar.google.com",
            linkText: "Prepare",
          },
          {
            id: "cal3",
            text: "1:1 with Manager",
            time: "Tomorrow, 2:00 PM - 2:30 PM",
            link: "https://calendar.google.com",
            linkText: "Agenda",
          },
        ],
      },
    ],
    recommendations: [
      "Block 1 hour before the code review meeting to review the relevant PRs",
      "Consider delegating the documentation PR to a junior developer for review experience",
      "The password reset issue should be prioritized as it affects production users",
      "Catch up on #frontend-team messages before tomorrow's sprint planning",
      "Prepare talking points for your 1:1 with your manager tomorrow",
    ],
  };
}

function generateMeetingHeavyScenario(): ActivityInsight {
  return {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString(),
    summary:
      "Your calendar is packed today with 6 meetings taking up 4.5 hours. You have 12 unread emails, including 3 marked as important. The product team is waiting for your input on the Q3 roadmap, and there are several Slack threads requiring your attention.",
    details: [
      {
        title: "Calendar Events",
        icon: <Calendar className="h-4 w-4 text-[#4285F4]" />,
        items: [
          {
            id: "cal1",
            text: "Daily Standup",
            time: "Today, 9:30 AM - 9:45 AM (Completed)",
            link: "https://calendar.google.com",
            linkText: "Notes",
          },
          {
            id: "cal2",
            text: "Product Roadmap Discussion",
            time: "Today, 11:00 AM - 12:00 PM (In 15 minutes)",
            link: "https://calendar.google.com",
            linkText: "Join",
            priority: "high",
          },
          {
            id: "cal3",
            text: "Team Lunch",
            time: "Today, 12:00 PM - 1:00 PM",
            link: "https://calendar.google.com",
            linkText: "Location",
          },
          {
            id: "cal4",
            text: "Client Demo Preparation",
            time: "Today, 2:00 PM - 3:00 PM",
            link: "https://calendar.google.com",
            linkText: "Agenda",
          },
          {
            id: "cal5",
            text: "Engineering All-Hands",
            time: "Today, 3:30 PM - 4:30 PM",
            link: "https://calendar.google.com",
            linkText: "Join",
          },
          {
            id: "cal6",
            text: "Project Retrospective",
            time: "Today, 4:45 PM - 5:30 PM",
            link: "https://calendar.google.com",
            linkText: "Prepare",
          },
        ],
      },
      {
        title: "Email Inbox",
        icon: <Mail className="h-4 w-4 text-[#EA4335]" />,
        items: [
          {
            id: "em1",
            text: "[IMPORTANT] Q3 Roadmap Feedback Needed",
            time: "From: Product Manager 45 minutes ago",
            link: "https://mail.google.com",
            linkText: "Read",
            priority: "high",
          },
          {
            id: "em2",
            text: "[IMPORTANT] Client Demo Agenda",
            time: "From: Account Executive 2 hours ago",
            link: "https://mail.google.com",
            linkText: "Read",
            priority: "high",
          },
          {
            id: "em3",
            text: "[IMPORTANT] Annual Performance Review Schedule",
            time: "From: HR Department yesterday",
            link: "https://mail.google.com",
            linkText: "Read",
            priority: "high",
          },
          {
            id: "em4",
            text: "Updated Design Mockups for Dashboard",
            time: "From: Design Team 3 hours ago",
            link: "https://mail.google.com",
            linkText: "View",
          },
          {
            id: "em5",
            text: "8 more unread emails",
            time: "From various senders",
            link: "https://mail.google.com",
            linkText: "Inbox",
          },
        ],
      },
      {
        title: "Slack Messages",
        icon: <MessageSquare className="h-4 w-4 text-[#4A154B]" />,
        items: [
          {
            id: "sl1",
            text: "@you mentioned in #product-team: 'We need your input on the API limitations'",
            time: "From: Product Manager 30 minutes ago",
            link: "https://slack.com",
            linkText: "Reply",
            priority: "high",
          },
          {
            id: "sl2",
            text: "Direct message: 'Can you share your slides for the client demo?'",
            time: "From: Sales Director 1 hour ago",
            link: "https://slack.com",
            linkText: "Reply",
          },
          {
            id: "sl3",
            text: "#engineering-team discussion about deployment schedule",
            time: "15 new messages in the last hour",
            link: "https://slack.com",
            linkText: "Open",
          },
        ],
      },
    ],
    recommendations: [
      "Consider blocking 30 minutes between meetings to catch up on emails and Slack",
      "Prioritize the Q3 Roadmap feedback as it's blocking the product team",
      "Prepare for the client demo by reviewing the latest design mockups",
      "Schedule focus time tomorrow morning to recover from today's meeting-heavy schedule",
      "Use the team lunch as an opportunity to informally discuss the deployment schedule",
    ],
  };
}

function generateProjectDeadlineScenario(): ActivityInsight {
  return {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString(),
    summary:
      "You're approaching a major project deadline in 2 days. There are 7 outstanding tasks assigned to you, and 3 are marked as high priority. The team has increased activity with 28 commits today, and QA has reported 5 new bugs that need attention before release.",
    details: [
      {
        title: "Notion Workspace",
        icon: <FileText className="h-4 w-4 text-black" />,
        items: [
          {
            id: "notion1",
            text: "Project Documentation Updates",
            time: "Most recent: 15 minutes ago",
            link: "https://notion.so",
            linkText: "Open",
          },
          {
            id: "notion2",
            text: "Sprint Tasks Database",
            time: "8 tasks completed today",
            link: "https://notion.so",
            linkText: "View Database",
          },
          {
            id: "notion3",
            text: "Project Requirements",
            time: "Pending your review - updated 3 hours ago",
            link: "https://notion.so",
            linkText: "Review",
            priority: "high",
          },
          {
            id: "notion4",
            text: "Team Knowledge Base",
            time: "New entry added 1 hour ago",
            link: "https://notion.so",
            linkText: "Open",
          },
        ],
      },
      {
        title: "Bug Reports",
        icon: <AlertCircle className="h-4 w-4 text-[#FF5630]" />,
        items: [
          {
            id: "bug1",
            text: "Users unable to reset password in certain timezones",
            time: "Reported: 2 hours ago by QA Team",
            link: "https://jira.com",
            linkText: "BUG-142",
            priority: "high",
          },
          {
            id: "bug2",
            text: "Dashboard charts not rendering in Safari",
            time: "Reported: 3 hours ago by QA Team",
            link: "https://jira.com",
            linkText: "BUG-141",
            priority: "high",
          },
          {
            id: "bug3",
            text: "API rate limiting not working correctly",
            time: "Reported: 4 hours ago by DevOps",
            link: "https://jira.com",
            linkText: "BUG-140",
            priority: "high",
          },
          {
            id: "bug4",
            text: "Inconsistent date formatting across the application",
            time: "Reported: Yesterday by Design Team",
            link: "https://jira.com",
            linkText: "BUG-138",
          },
          {
            id: "bug5",
            text: "Search functionality returns incorrect results for special characters",
            time: "Reported: Yesterday by QA Team",
            link: "https://jira.com",
            linkText: "BUG-137",
          },
        ],
      },
      {
        title: "Team Activity",
        icon: <Github className="h-4 w-4 text-[#24292e]" />,
        items: [
          {
            id: "team1",
            text: "28 commits pushed to main branch today",
            time: "Most recent: 15 minutes ago",
            link: "https://github.com",
            linkText: "View",
          },
          {
            id: "team2",
            text: "8 pull requests merged today",
            time: "Most recent: 45 minutes ago",
            link: "https://github.com",
            linkText: "View",
          },
          {
            id: "team3",
            text: "3 pull requests awaiting your review",
            time: "Oldest: 3 hours ago",
            link: "https://github.com",
            linkText: "Review",
            priority: "high",
          },
          {
            id: "team4",
            text: "Release branch created by DevOps",
            time: "1 hour ago",
            link: "https://github.com",
            linkText: "View",
          },
        ],
      },
      {
        title: "Upcoming Meetings",
        icon: <Calendar className="h-4 w-4 text-[#4285F4]" />,
        items: [
          {
            id: "cal1",
            text: "Daily Standup",
            time: "Tomorrow, 9:30 AM - 9:45 AM",
            link: "https://calendar.google.com",
            linkText: "Join",
          },
          {
            id: "cal2",
            text: "Pre-release Review",
            time: "Tomorrow, 2:00 PM - 3:00 PM",
            link: "https://calendar.google.com",
            linkText: "Prepare",
            priority: "high",
          },
          {
            id: "cal3",
            text: "Final Release Go/No-Go",
            time: "In 2 days, 10:00 AM - 10:30 AM",
            link: "https://calendar.google.com",
            linkText: "Agenda",
            priority: "high",
          },
        ],
      },
    ],
    recommendations: [
      "Focus on the high-priority bugs first as they could block the release",
      "Consider pairing with a team member on the authentication edge cases to speed up resolution",
      "Delegate the API documentation task if possible to focus on critical path items",
      "Block at least 2 hours of uninterrupted time tomorrow for the performance optimization task",
      "Prepare a status update for the standup to ensure the team is aligned on priorities",
    ],
  };
}

function generateBugFixScenario(): ActivityInsight {
  return {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString(),
    summary:
      "A critical production bug has been reported affecting user authentication. Support has received 15 customer complaints in the last hour. The DevOps team has identified a potential cause related to the recent deployment, and a war room has been set up to coordinate the fix.",
    details: [
      {
        title: "Incident Details",
        icon: <AlertCircle className="h-4 w-4 text-[#FF5630]" />,
        items: [
          {
            id: "inc1",
            text: "CRITICAL: Authentication service returning 500 errors",
            time: "Reported: 1 hour ago by Support Team",
            link: "https://jira.com",
            linkText: "INC-001",
            priority: "high",
          },
          {
            id: "inc2",
            text: "Error rate increased to 75% for authentication endpoints",
            time: "First detected: 1 hour 15 minutes ago",
            link: "https://grafana.com",
            linkText: "Dashboard",
            priority: "high",
          },
          {
            id: "inc3",
            text: "15 customer complaints received via support channels",
            time: "Most recent: 5 minutes ago",
            link: "https://zendesk.com",
            linkText: "Tickets",
            priority: "high",
          },
          {
            id: "inc4",
            text: "War room established in #incident-response channel",
            time: "Started: 45 minutes ago",
            link: "https://slack.com",
            linkText: "Join",
            priority: "high",
          },
        ],
      },
      {
        title: "Recent Deployments",
        icon: <Code className="h-4 w-4 text-[#36B37E]" />,
        items: [
          {
            id: "dep1",
            text: "Authentication Service v2.4.0 deployed to production",
            time: "Deployed: 3 hours ago by CI/CD pipeline",
            link: "https://jenkins.com",
            linkText: "Build #1245",
            priority: "high",
          },
          {
            id: "dep2",
            text: "Database migration script executed",
            time: "Executed: 2 hours 55 minutes ago",
            link: "https://jenkins.com",
            linkText: "Logs",
          },
          {
            id: "dep3",
            text: "Config change: Updated rate limiting parameters",
            time: "Applied: 2 hours 50 minutes ago",
            link: "https://notion.so",
            linkText: "Documentation",
          },
        ],
      },
      {
        title: "Team Activity",
        icon: <MessageSquare className="h-4 w-4 text-[#4A154B]" />,
        items: [
          {
            id: "team1",
            text: "@you mentioned in #incident-response: 'Can you check the authentication logs?'",
            time: "From: DevOps Lead 10 minutes ago",
            link: "https://slack.com",
            linkText: "Reply",
            priority: "high",
          },
          {
            id: "team2",
            text: "Direct message: 'Do you have access to the production database?'",
            time: "From: Database Admin 15 minutes ago",
            link: "https://slack.com",
            linkText: "Reply",
            priority: "high",
          },
          {
            id: "team3",
            text: "Notion page updated: 'Authentication Service Troubleshooting Guide'",
            time: "By: Senior Developer 20 minutes ago",
            link: "https://notion.so",
            linkText: "Open",
            priority: "high",
          },
        ],
      },
      {
        title: "System Metrics",
        icon: <BarChart className="h-4 w-4 text-[#0052CC]" />,
        items: [
          {
            id: "met1",
            text: "CPU usage spiked to 95% on auth service instances",
            time: "Started: 1 hour 15 minutes ago",
            link: "https://grafana.com",
            linkText: "Graph",
          },
          {
            id: "met2",
            text: "Database connection pool exhausted",
            time: "First occurred: 1 hour 10 minutes ago",
            link: "https://grafana.com",
            linkText: "Graph",
          },
          {
            id: "met3",
            text: "Memory usage increased by 40% after deployment",
            time: "Trend started: 3 hours ago",
            link: "https://grafana.com",
            linkText: "Graph",
          },
        ],
      },
    ],
    recommendations: [
      "Join the war room immediately to coordinate with the team",
      "Review the pull request created by the Senior Developer as it may contain the fix",
      "Check if the database connection pool exhaustion is related to the config change",
      "Prepare for a potential rollback if the fix cannot be implemented quickly",
      "Keep the support team updated so they can communicate with affected customers",
    ],
  };
}
