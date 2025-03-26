"use client"

import { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TriforceIcon } from "./triforce-icon"
import { LogOut, Settings, User, Link2 } from "lucide-react"
import { ConnectedServicesDialog } from "./connected-services-dialog"

export function AppHeader() {
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false)

  return (
    <>
      <header className="h-16 border-b flex items-center px-6 bg-background">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8">
            <TriforceIcon />
          </div>
          <span className="text-xl font-bold text-triforce dark:text-triforce-dark">Triforce</span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">User</p>
                  <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setServicesDialogOpen(true)}>
                <Link2 className="mr-2 h-4 w-4" />
                <span>Connected Services</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ConnectedServicesDialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen} />
    </>
  )
}

