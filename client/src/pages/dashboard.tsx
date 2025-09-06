import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import MetricsCards from "@/components/metrics-cards";
import RevenueChart from "@/components/revenue-chart";
import QRCodeGenerator from "@/components/qr-code-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, Mail, Megaphone, UserPlus, CreditCard, 
  QrCode, AlertTriangle, FileText, TrendingUp, Calendar,
  Users, Activity
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  // Fetch user's gyms and branches
  const { data: gyms } = useQuery({
    queryKey: ["/api/gyms"],
    enabled: !!user,
  });

  const { data: branches } = useQuery({
    queryKey: ["/api/branches", gyms?.[0]?.id],
    enabled: !!gyms?.[0]?.id,
  });

  const { data: currentBranch } = useQuery({
    queryKey: ["/api/branch", selectedBranch],
    enabled: !!selectedBranch,
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/analytics", selectedBranch],
    enabled: !!selectedBranch,
  });

  const { data: expiringMembers } = useQuery({
    queryKey: ["/api/members/expiring", selectedBranch, "7"],
    enabled: !!selectedBranch,
  });

  // Set first branch as default
  useEffect(() => {
    if (branches?.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const defaultMetrics = {
    totalMembers: 0,
    activeMembers: 0,
    monthlyRevenue: 0,
    pendingFees: 0,
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentBranch={selectedBranch}
        branches={branches}
        onBranchChange={setSelectedBranch}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard Overview" />
        
        <main className="flex-1 overflow-auto p-6">
          {!selectedBranch ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please select a branch to view dashboard</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Key Metrics */}
              <MetricsCards 
                metrics={metrics || defaultMetrics} 
                isLoading={!metrics && !!selectedBranch}
              />

              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RevenueChart isLoading={!metrics && !!selectedBranch} />
                
                {/* Member Analytics */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle data-testid="text-member-analytics-title">Member Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Members</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-chart-2 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${metrics ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100) : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {metrics ? Math.round((metrics.activeMembers / metrics.totalMembers) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Inactive Members</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-chart-1 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${metrics ? Math.round(((metrics.totalMembers - metrics.activeMembers) / metrics.totalMembers) * 100) : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {metrics ? Math.round(((metrics.totalMembers - metrics.activeMembers) / metrics.totalMembers) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground mb-2">Quick Stats</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Members</span>
                          <span className="font-medium text-foreground">{metrics?.totalMembers || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Active Members</span>
                          <span className="font-medium text-foreground">{metrics?.activeMembers || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Monthly Revenue</span>
                          <span className="font-medium text-foreground">₹{metrics?.monthlyRevenue.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expiring Memberships & QR Registration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Expiring Memberships */}
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle data-testid="text-expiring-memberships-title">Expiring Memberships</CardTitle>
                    <Badge variant="destructive" data-testid="badge-urgent-count">
                      {expiringMembers?.length || 0} Urgent
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {!expiringMembers?.length ? (
                      <p className="text-center text-muted-foreground py-4">
                        No memberships expiring soon
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {expiringMembers.slice(0, 3).map((member: any) => (
                          <div 
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                            data-testid={`card-expiring-member-${member.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-destructive text-destructive-foreground text-xs">
                                  {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{member.name}</p>
                                <p className="text-xs text-destructive">
                                  Expires {new Date(member.membershipEnd).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-remind-${member.id}`}
                            >
                              Send Reminder
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {expiringMembers?.length > 3 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button variant="ghost" className="w-full" data-testid="button-view-all-expiring">
                          View All Expiring Memberships →
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* QR Registration */}
                <QRCodeGenerator
                  branchId={selectedBranch}
                  currentQRCode={currentBranch?.qrCodeUrl}
                  todayRegistrations={0}
                  weekRegistrations={0}
                />
              </div>

              {/* Communication Panel */}
              <Card className="shadow-sm mb-8">
                <CardHeader>
                  <CardTitle data-testid="text-communication-title">Communication Center</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-chart-2/10 border border-chart-2/20">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageCircle className="text-chart-2" />
                        <h4 className="font-medium text-foreground">WhatsApp</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Send reminders and updates</p>
                      <div className="space-y-2">
                        <Button 
                          size="sm" 
                          className="w-full bg-chart-2 hover:bg-chart-2/90"
                          data-testid="button-whatsapp-reminders"
                        >
                          Send Payment Reminders
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full border-chart-2 text-chart-2 hover:bg-chart-2/10"
                          data-testid="button-whatsapp-announcement"
                        >
                          Send Announcement
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-chart-1/10 border border-chart-1/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="text-chart-1" />
                        <h4 className="font-medium text-foreground">Email</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Send receipts and newsletters</p>
                      <div className="space-y-2">
                        <Button 
                          size="sm" 
                          className="w-full bg-chart-1 hover:bg-chart-1/90"
                          data-testid="button-email-receipts"
                        >
                          Send Receipts
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full border-chart-1 text-chart-1 hover:bg-chart-1/10"
                          data-testid="button-email-newsletter"
                        >
                          Send Newsletter
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Megaphone className="text-primary" />
                        <h4 className="font-medium text-foreground">Announcements</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Special offers and news</p>
                      <div className="space-y-2">
                        <Button 
                          size="sm" 
                          className="w-full"
                          data-testid="button-create-announcement"
                        >
                          Create Announcement
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          data-testid="button-view-announcements"
                        >
                          View All
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity & Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle data-testid="text-recent-activity-title">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-chart-2/20 rounded-full flex items-center justify-center">
                          <UserPlus className="h-4 w-4 text-chart-2" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">New member registered</p>
                          <p className="text-xs text-muted-foreground">Via QR registration system</p>
                        </div>
                        <span className="text-xs text-muted-foreground">Recent</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Payment processed</p>
                          <p className="text-xs text-muted-foreground">Monthly membership fee</p>
                        </div>
                        <span className="text-xs text-muted-foreground">Recent</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-chart-1/20 rounded-full flex items-center justify-center">
                          <QrCode className="h-4 w-4 text-chart-1" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Member check-in</p>
                          <p className="text-xs text-muted-foreground">QR code attendance scan</p>
                        </div>
                        <span className="text-xs text-muted-foreground">Recent</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Payment reminder sent</p>
                          <p className="text-xs text-muted-foreground">WhatsApp notification sent</p>
                        </div>
                        <span className="text-xs text-muted-foreground">Recent</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Reports */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle data-testid="text-reports-title">Quick Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-chart-2" />
                          <span className="text-sm font-medium text-foreground">Member Report</span>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-chart-2 hover:bg-chart-2/90"
                          data-testid="button-export-member-report"
                        >
                          Export Excel
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-chart-1" />
                          <span className="text-sm font-medium text-foreground">Payment Report</span>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-chart-1 hover:bg-chart-1/90"
                          data-testid="button-export-payment-report"
                        >
                          Export PDF
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Revenue Analysis</span>
                        </div>
                        <Button 
                          size="sm"
                          data-testid="button-export-revenue-report"
                        >
                          Export PDF
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-chart-4" />
                          <span className="text-sm font-medium text-foreground">Attendance Report</span>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-chart-4 hover:bg-chart-4/90"
                          data-testid="button-export-attendance-report"
                        >
                          Export Excel
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <Button 
                        variant="ghost" 
                        className="w-full" 
                        data-testid="button-view-all-reports"
                      >
                        View All Reports →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
