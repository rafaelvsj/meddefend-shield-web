import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminMessages = () => {
  const messages = [
    {
      id: 1,
      subject: "Support Request",
      from: "user@example.com",
      preview: "I need help with my account settings...",
      time: "2 hours ago",
      unread: true
    },
    {
      id: 2,
      subject: "Billing Question",
      from: "customer@company.com",
      preview: "Can you help me understand my invoice?",
      time: "5 hours ago",
      unread: true
    },
    {
      id: 3,
      subject: "Feature Request",
      from: "feedback@user.com",
      preview: "Would love to see a dark mode option...",
      time: "1 day ago",
      unread: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            Manage customer communications
          </p>
        </div>
        <Badge variant="secondary">3 unread</Badge>
      </div>
      
      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id} className={message.unread ? "border-primary/50" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{message.subject}</CardTitle>
                <div className="flex items-center gap-2">
                  {message.unread && <Badge variant="default" className="text-xs">New</Badge>}
                  <span className="text-sm text-muted-foreground">{message.time}</span>
                </div>
              </div>
              <CardDescription>From: {message.from}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{message.preview}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminMessages;