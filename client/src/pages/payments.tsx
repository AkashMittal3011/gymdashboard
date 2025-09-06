import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import PaymentDashboard from "@/components/payment-dashboard";
import PaymentForm from "@/components/payment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, CreditCard, AlertTriangle, CheckCircle, 
  Clock, IndianRupee, Calendar, TrendingUp 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Payments() {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Fetch user's gyms and branches
  const { data: gyms } = useQuery({
    queryKey: ["/api/gyms"],
    enabled: !!user,
  });

  const { data: branches } = useQuery({
    queryKey: ["/api/branches", gyms?.[0]?.id],
    enabled: !!gyms?.[0]?.id,
  });

  const { data: pendingPayments, isLoading: loadingPending } = useQuery({
    queryKey: ["/api/payments/pending", selectedBranch],
    enabled: !!selectedBranch,
  });

  const { data: members } = useQuery({
    queryKey: ["/api/members", selectedBranch],
    enabled: !!selectedBranch,
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/analytics", selectedBranch],
    enabled: !!selectedBranch,
  });

  // Set first branch as default
  useEffect(() => {
    if (branches?.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default" as const, className: "bg-chart-2 hover:bg-chart-2/90", icon: CheckCircle },
      pending: { variant: "outline" as const, className: "border-chart-4 text-chart-4", icon: Clock },
      overdue: { variant: "destructive" as const, className: "", icon: AlertTriangle },
      failed: { variant: "destructive" as const, className: "", icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className} data-testid={`badge-status-${status}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredPayments = pendingPayments?.filter((payment: any) => {
    const memberData = members?.find((m: any) => m.id === payment.memberId);
    return memberData?.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentBranch={selectedBranch}
        branches={branches}
        onBranchChange={setSelectedBranch}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Payments Management" />
        
        <main className="flex-1 overflow-auto p-6">
          {!selectedBranch ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please select a branch to view payments</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Payment Dashboard */}
              <PaymentDashboard 
                metrics={metrics}
                isLoading={!metrics && !!selectedBranch}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Payments */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2" data-testid="text-pending-payments-title">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Pending Payments ({filteredPayments.length})
                        </CardTitle>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-payments"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingPending ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                          <p className="text-muted-foreground">Loading payments...</p>
                        </div>
                      ) : filteredPayments.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-chart-2 mx-auto mb-4" />
                          <p className="text-muted-foreground">No pending payments</p>
                          <p className="text-sm text-muted-foreground">All payments are up to date</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredPayments.map((payment: any) => {
                                const memberData = members?.find((m: any) => m.id === payment.memberId);
                                const isOverdue = payment.dueDate && new Date(payment.dueDate) < new Date();
                                
                                return (
                                  <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>
                                            {memberData ? getInitials(memberData.name) : 'M'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-foreground" data-testid={`text-member-name-${payment.id}`}>
                                            {memberData?.name || 'Unknown Member'}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            {memberData?.membershipPlan} Plan
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-semibold text-foreground" data-testid={`text-amount-${payment.id}`}>
                                        ₹{Number(payment.amount).toLocaleString()}
                                      </span>
                                    </TableCell>
                                    <TableCell data-testid={`text-due-date-${payment.id}`}>
                                      {payment.dueDate ? (
                                        <span className={isOverdue ? "text-destructive font-medium" : ""}>
                                          {new Date(payment.dueDate).toLocaleDateString()}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">No due date</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {getStatusBadge(isOverdue ? "overdue" : payment.status)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button 
                                              size="sm" 
                                              onClick={() => setSelectedPayment(payment)}
                                              data-testid={`button-process-payment-${payment.id}`}
                                            >
                                              Process Payment
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-md">
                                            <DialogHeader>
                                              <DialogTitle>Process Payment</DialogTitle>
                                            </DialogHeader>
                                            {selectedPayment && (
                                              <PaymentForm
                                                amount={Number(selectedPayment.amount)}
                                                memberId={selectedPayment.memberId}
                                                onSuccess={() => setSelectedPayment(null)}
                                              />
                                            )}
                                          </DialogContent>
                                        </Dialog>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          data-testid={`button-send-reminder-${payment.id}`}
                                        >
                                          Send Reminder
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Summary & Quick Actions */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle data-testid="text-payment-summary-title">Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Pending</span>
                        <span className="font-semibold text-destructive" data-testid="text-total-pending">
                          ₹{metrics?.pendingFees.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                        <span className="font-semibold text-chart-2" data-testid="text-monthly-revenue">
                          ₹{metrics?.monthlyRevenue.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Overdue Count</span>
                        <span className="font-semibold text-foreground" data-testid="text-overdue-count">
                          {filteredPayments.filter((p: any) => 
                            p.dueDate && new Date(p.dueDate) < new Date()
                          ).length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle data-testid="text-quick-actions-title">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" data-testid="button-send-bulk-reminders">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Send Bulk Reminders
                      </Button>
                      <Button variant="outline" className="w-full" data-testid="button-export-payment-report">
                        <Calendar className="h-4 w-4 mr-2" />
                        Export Payment Report
                      </Button>
                      <Button variant="outline" className="w-full" data-testid="button-payment-analytics">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle data-testid="text-recent-payments-title">Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div>
                            <p className="text-sm font-medium text-foreground">John Doe</p>
                            <p className="text-xs text-muted-foreground">Monthly Plan</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-chart-2">₹2,500</p>
                            <p className="text-xs text-muted-foreground">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div>
                            <p className="text-sm font-medium text-foreground">Sarah Smith</p>
                            <p className="text-xs text-muted-foreground">Quarterly Plan</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-chart-2">₹7,000</p>
                            <p className="text-xs text-muted-foreground">5 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div>
                            <p className="text-sm font-medium text-foreground">Mike Wilson</p>
                            <p className="text-xs text-muted-foreground">Yearly Plan</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-chart-2">₹25,000</p>
                            <p className="text-xs text-muted-foreground">1 day ago</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
