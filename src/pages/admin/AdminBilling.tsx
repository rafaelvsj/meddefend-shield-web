import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAdminBilling } from "@/hooks/useAdminBilling";

const AdminBilling = () => {
  const { data, loading, error } = useAdminBilling();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Error loading billing data: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No billing data available</p>
      </div>
    );
  }

  const { plans, recentTransactions } = data;

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