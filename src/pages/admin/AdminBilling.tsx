import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminBilling = () => {
  const plans = [
    { name: "Basic", price: "R$ 29", users: 145, revenue: "R$ 4,205" },
    { name: "Pro", price: "R$ 59", users: 89, revenue: "R$ 5,251" },
    { name: "Premium", price: "R$ 99", users: 67, revenue: "R$ 6,633" }
  ];

  const recentTransactions = [
    {
      id: 1,
      user: "Dr. João Silva",
      plan: "Premium",
      amount: "R$ 99,00",
      status: "Completed",
      date: "Today"
    },
    {
      id: 2,
      user: "Dra. Maria Santos",
      plan: "Pro",
      amount: "R$ 59,00",
      status: "Completed",
      date: "Yesterday"
    },
    {
      id: 3,
      user: "Dr. Pedro Costa",
      plan: "Basic",
      amount: "R$ 29,00",
      status: "Pending",
      date: "2 days ago"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Plans & Billing</h2>
        <p className="text-muted-foreground">
          Monitor subscription plans and revenue
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                <Badge variant="outline">{plan.price}/month</Badge>
              </CardTitle>
              <CardDescription>Active subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plan.users} users</div>
              <p className="text-sm text-muted-foreground">
                Monthly revenue: {plan.revenue}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest billing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{transaction.user}</p>
                  <p className="text-sm text-muted-foreground">{transaction.plan} Plan</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{transaction.amount}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={transaction.status === 'Completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{transaction.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBilling;