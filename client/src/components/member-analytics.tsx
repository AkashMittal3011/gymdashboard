import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, TrendingUp, TrendingDown } from "lucide-react";

interface MemberAnalyticsProps {
  metrics?: {
    totalMembers: number;
    activeMembers: number;
    monthlyRevenue: number;
    pendingFees: number;
  };
  members?: any[];
  isLoading?: boolean;
}

export default function MemberAnalytics({ metrics, members, isLoading }: MemberAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeRate = metrics ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100) : 0;
  const inactiveMembers = metrics ? metrics.totalMembers - metrics.activeMembers : 0;
  const churnRate = 8; // Mock churn rate

  // Calculate membership plan distribution
  const planDistribution = members?.reduce((acc: any, member: any) => {
    acc[member.membershipPlan] = (acc[member.membershipPlan] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Member Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-members">
                  {metrics?.activeMembers || 0}
                </p>
                <p className="text-xs text-chart-2">
                  {activeRate}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive Members</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-inactive-members">
                  {inactiveMembers}
                </p>
                <p className="text-xs text-muted-foreground">
                  {100 - activeRate}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-churn-rate">
                  {churnRate}%
                </p>
                <p className="text-xs text-destructive">
                  Monthly churn
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-membership-plans-title">Membership Plans Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(planDistribution).map(([plan, count]) => {
              const percentage = metrics ? Math.round((count as number / metrics.totalMembers) * 100) : 0;
              return (
                <div key={plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" data-testid={`badge-plan-${plan}`}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {count} members
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Member Growth Trends */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-growth-trends-title">Member Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">This Month</h4>
              <div className="flex items-center justify-between p-3 rounded-lg bg-chart-2/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-chart-2" />
                  <span className="text-sm text-muted-foreground">New Registrations</span>
                </div>
                <span className="font-semibold text-foreground" data-testid="text-new-registrations">
                  23
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Cancellations</span>
                </div>
                <span className="font-semibold text-foreground" data-testid="text-cancellations">
                  5
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Net Growth</span>
                </div>
                <span className="font-semibold text-foreground" data-testid="text-net-growth">
                  +18
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Key Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retention Rate</span>
                  <span className="font-medium text-chart-2" data-testid="text-retention-rate">92%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Tenure</span>
                  <span className="font-medium text-foreground" data-testid="text-average-tenure">8.5 months</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Referral Rate</span>
                  <span className="font-medium text-chart-1" data-testid="text-referral-rate">15%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Satisfaction</span>
                  <span className="font-medium text-primary" data-testid="text-satisfaction">4.7/5</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
