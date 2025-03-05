import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Plus } from "lucide-react"

const tasks = [
  { id: 1, title: "Redesign homepage", status: "In Progress", dueDate: "2023-06-30", progress: 60 },
  { id: 2, title: "Implement new API", status: "To Do", dueDate: "2023-07-15", progress: 0 },
  { id: 3, title: "Write documentation", status: "In Progress", dueDate: "2023-07-05", progress: 30 },
  { id: 4, title: "Test new features", status: "To Do", dueDate: "2023-07-20", progress: 0 },
  { id: 5, title: "Deploy to production", status: "Completed", dueDate: "2023-06-25", progress: 100 },
]

export default function TasksPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
            <CardDescription>Organize and track your team's tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="inProgress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <Checkbox id={`task-${task.id}`} />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <span>Due {task.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={task.status === "Completed" ? "default" : "secondary"}>{task.status}</Badge>
                        <div className="w-32">
                          <Progress value={task.progress} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

