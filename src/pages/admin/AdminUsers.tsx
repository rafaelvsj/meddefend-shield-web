import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Settings } from "lucide-react";

const AdminUsers = () => {
  const users = [
    {
      id: 1,
      name: "Dr. João Silva",
      email: "joao@medico.com",
      plan: "Premium",
      status: "Active",
      lastLogin: "2 hours ago"
    },
    {
      id: 2,
      name: "Dra. Maria Santos",
      email: "maria@hospital.com",
      plan: "Pro",
      status: "Active",
      lastLogin: "1 day ago"
    },
    {
      id: 3,
      name: "Dr. Pedro Costa",
      email: "pedro@clinica.com",
      plan: "Basic",
      status: "Inactive",
      lastLogin: "1 week ago"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and subscriptions
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/users/roles" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Role Manager
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.plan === 'Premium' ? 'default' : 'secondary'}>
                      {user.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;