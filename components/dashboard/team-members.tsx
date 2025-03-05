"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "offline" | "busy"
  avatar?: string
}

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Olivia Martin",
    email: "olivia.martin@example.com",
    role: "Product Manager",
    status: "active",
  },
  {
    id: "2",
    name: "Jackson Lee",
    email: "jackson.lee@example.com",
    role: "Designer",
    status: "active",
  },
  {
    id: "3",
    name: "Isabella Nguyen",
    email: "isabella.nguyen@example.com",
    role: "Software Engineer",
    status: "busy",
  },
  {
    id: "4",
    name: "William Kim",
    email: "will.kim@example.com",
    role: "Frontend Developer",
    status: "offline",
  },
  {
    id: "5",
    name: "Sofia Davis",
    email: "sofia.davis@example.com",
    role: "Marketing Manager",
    status: "active",
  },
]

export function TeamMembers() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="grid grid-cols-5 p-4 text-sm font-medium">
          <div className="col-span-2">Name</div>
          <div className="col-span-2">Role</div>
          <div className="text-right">Status</div>
        </div>
        <div className="divide-y">
          {teamMembers.map((member) => (
            <div key={member.id} className="grid grid-cols-5 items-center p-4 hover:bg-accent/50">
              <div className="col-span-2 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                  <AvatarFallback>
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                </div>
              </div>
              <div className="col-span-2">{member.role}</div>
              <div className="flex items-center justify-end gap-2">
                <Badge
                  variant="outline"
                  className={
                    member.status === "active"
                      ? "bg-green-500/10 text-green-500"
                      : member.status === "busy"
                        ? "bg-orange-500/10 text-orange-500"
                        : "bg-muted text-muted-foreground"
                  }
                >
                  {member.status === "active" && "Active"}
                  {member.status === "busy" && "Busy"}
                  {member.status === "offline" && "Offline"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View profile</DropdownMenuItem>
                    <DropdownMenuItem>Send message</DropdownMenuItem>
                    <DropdownMenuItem>Assign tasks</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

