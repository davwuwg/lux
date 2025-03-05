import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Messages</h2>
      </div>
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Messaging Center</CardTitle>
            <CardDescription>Communicate with your team and clients</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add your messaging content here */}
            <p>Messaging and communication tools go here.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

