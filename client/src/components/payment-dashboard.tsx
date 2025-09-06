import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, CreditCard, AlertTriangle, TrendingUp } from "lucide-react";

interface PaymentDashboardProps {
  metrics?: {
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    pendingFees: number;
  };
  isLoading?: boolean;
}

export default function PaymentDashboard({ metrics, isLoading }: PaymentDashboardProps) {
  const cards = [
    {
      title: "Monthly Revenue",
      value: `₹${metrics?.monthlyRevenue.toLocaleString() || 0}`,
      change: "+5.2% from last month",
      changeType: "positive",
      icon: IndianRupee,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "Pending Fees",
      value: `₹${metrics?.pendingFees.toLocaleString() || 0}`,
      change: "32 overdue payments",
      changeType: "negative",
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
    },
    {
      title: "Payment Rate",
      value: "94%",
      change: "On-time payment rate",
      changeType: "positive",
      icon: CreditCard,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Collection Rate",
      value: "₹85K",
      change: "This month's collections",
      changeType: "positive",
      icon: TrendingUp,
      color: "bg-chart-1/10 text-chart-1",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </div>
                <div className="w-12 h-12 bg-muted rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" data-testid={`text-${card.title.toLowerCase().replace(' ', '-')}-label`}>
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground" data-testid={`text-${card.title.toLowerCase().replace(' ', '-')}-value`}>
                  {card.value}
                </p>
                <p className={`text-xs mt-1 ${
                  card.changeType === 'positive' ? 'text-chart-2' : 'text-destructive'
                }`} data-testid={`text-${card.title.toLowerCase().replace(' ', '-')}-change`}>
                  {card.change}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
