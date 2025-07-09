import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

const AdminTemplates = () => {
  const templates = [
    {
      id: 1,
      name: "Cardiologia Básica",
      category: "Cardiovascular",
      usage: 234,
      status: "Active"
    },
    {
      id: 2,
      name: "Exame Neurológico",
      category: "Neurologia",
      usage: 156,
      status: "Active"
    },
    {
      id: 3,
      name: "Análise Respiratória",
      category: "Pneumologia",
      usage: 89,
      status: "Draft"
    },
    {
      id: 4,
      name: "Diagnóstico Dermatológico",
      category: "Dermatologia",
      usage: 67,
      status: "Active"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
          <p className="text-muted-foreground">
            Manage AI analysis templates
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <Badge variant={template.status === 'Active' ? 'default' : 'secondary'}>
                  {template.status}
                </Badge>
              </div>
              <CardDescription>{template.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Used {template.usage} times this month
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminTemplates;