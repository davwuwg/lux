"use client"

import { CheckCircle2, Clock, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

type Task = {
  id: string
  title: string
  status: "completed" | "in-progress" | "cancelled"
  date: string
}

const tasks: Task[] = [
  {
    id: "TASK-8782",
    title: "Create new marketing campaign for Q4",
    status: "completed",
    date: "2 hours ago",
  },
  {
    id: "TASK-7878",
    title: "Review and approve Q3 financial reports",
    status: "in-progress",
    date: "3 hours ago",
  },
  {
    id: "TASK-7839",
    title: "Update employee handbook with new policies",
    status: "completed",
    date: "5 hours ago",
  },
  {
    id: "TASK-7349",
    title: "Prepare presentation for board meeting",
    status: "in-progress",
    date: "1 day ago",
  },
  {
    id: "TASK-8571",
    title: "Interview candidates for senior developer position",
    status: "cancelled",
    date: "1 day ago",
  },
  {
    id: "TASK-9283",
    title: "Finalize budget for new project",
    status: "completed",
    date: "2 days ago",
  },
]

export function RecentTasks() {
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between space-x-4 rounded-md border p-4 transition-all hover:bg-accent/50"
          >
            <div className="flex items-start gap-3 overflow-hidden">
              {task.status === "completed" && <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />}
              {task.status === "in-progress" && <Clock className="mt-0.5 h-5 w-5 text-blue-500" />}
              {task.status === "cancelled" && <XCircle className="mt-0.5 h-5 w-5 text-red-500" />}
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{task.title}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{task.id}</p>
                  <p className="text-xs text-muted-foreground">{task.date}</p>
                </div>
              </div>
            </div>
            <Badge
              variant={
                task.status === "completed" ? "default" : task.status === "in-progress" ? "outline" : "destructive"
              }
              className="whitespace-nowrap"
            >
              {task.status === "completed" && "Completed"}
              {task.status === "in-progress" && "In Progress"}
              {task.status === "cancelled" && "Cancelled"}
            </Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

