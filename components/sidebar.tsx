"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Home, MessageSquare, PieChart, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  const items = [
    {
      title: "Home",
      icon: Home,
      href: "/dashboard",
    },
    {
      title: "Analytics",
      icon: PieChart,
      href: "/dashboard/analytics",
    },
    {
      title: "Messages",
      icon: MessageSquare,
      href: "/dashboard/messages",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ]

  return (
    <div
      className={cn(
        "group/sidebar h-full border-r bg-background flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="h-16 border-b flex items-center justify-between px-4">
        {!collapsed && <span className="font-semibold">Navigation</span>}
        <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => onCollapse(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
                pathname === item.href ? "bg-muted font-medium" : "text-muted-foreground",
                collapsed ? "justify-center" : "",
              )}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

