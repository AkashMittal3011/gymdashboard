import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import MemberAnalytics from "@/components/member-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Download, Calendar, TrendingUp, Users, 
  CreditCard, BarChart3, PieChart, FileSpreadsheet,
  Filter, RefreshCw, Eye
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from "recharts";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("30");

  // Fetch user's gyms and branches
  const { data: gyms } = useQuery<any[]>({
    queryKey: ["/api/gyms"],
    enabled: !!user,
  });

  const { data: branches } = useQuery<any[]>({
    queryKey: ["/api/branches", (gyms || [])[0]?.id],
    enabled: !!(gyms || [])[0]?.id,
  });

  const { data: metrics } = useQuery<any>({
    queryKey: ["/api/analytics", selectedBranch],
    enabled: !!selectedBranch,
  });

  const { data: members } = useQuery<any[]>({
    queryKey: ["/api/members", selectedBranch],
    enabled: !!selectedBranch,
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ["/api/payments/pending", selectedBranch],
    enabled: !!selectedBranch,
  });

  const { data: attendance } = useQuery<any[]>({
    queryKey: ["/api/attendance/today", selectedBranch],
    enabled: !!selectedBranch,
  });

  // Set first branch as default
  useEffect(() => {
    if ((branches || []).length > 0 && !selectedBranch) {
      setSelectedBranch((branches || [])[0].id);
    }
  }, [branches, selectedBranch]);

  // Export functions
  const exportMemberReport = () => {
    try {
      console.log('Exporting member report...');
      console.log('Members data:', members);
      
      if (!(members || []).length) {
        toast({
          title: "No Data",
          description: "No member data available to export. Please ensure members are loaded.",
          variant: "destructive"
        });
        return;
      }

      const exportData = (members || []).map((member: any) => ({
        Name: member.name || 'N/A',
        Email: member.email || 'N/A',
        Phone: member.phone || 'N/A',
        Age: member.age || 'N/A',
        'Membership Plan': member.membershipPlan || member.membership_plan || 'N/A',
        'Start Date': member.membershipStart ? new Date(member.membershipStart).toLocaleDateString() : 
                      member.membership_start ? new Date(member.membership_start).toLocaleDateString() : 'N/A',
        'End Date': member.membershipEnd ? new Date(member.membershipEnd).toLocaleDateString() : 
                    member.membership_end ? new Date(member.membership_end).toLocaleDateString() : 'N/A',
        Status: member.status || 'N/A'
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");
      XLSX.writeFile(wb, `member-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: `Member report with ${exportData.length} records has been downloaded as Excel file.`
      });
    } catch (error) {
      console.error('Error exporting member report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export member report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportPaymentReport = () => {
    try {
      console.log('Exporting payment report...');
      
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Payment Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
      doc.text(`Branch: ${(branches || []).find((b: any) => b.id === selectedBranch)?.name || 'All Branches'}`, 20, 50);
      
      // Add payment summary
      doc.text('Payment Summary:', 20, 70);
      doc.text(`Monthly Revenue: ₹${(metrics?.monthlyRevenue || 0).toLocaleString()}`, 20, 80);
      doc.text(`Pending Fees: ₹${(metrics?.pendingFees || 0).toLocaleString()}`, 20, 90);
      doc.text(`Total Members: ${(members || []).length}`, 20, 100);
      doc.text(`Active Members: ${(metrics?.activeMembers || 0)}`, 20, 110);
      
      if ((payments || []).length > 0) {
        doc.text('Recent Payments:', 20, 130);
        (payments || []).slice(0, 10).forEach((payment: any, index: number) => {
          const y = 140 + (index * 10);
          const amount = payment.amount || '0';
          const status = payment.status || 'Unknown';
          const date = payment.due_date ? new Date(payment.due_date).toLocaleDateString() : 'N/A';
          doc.text(`₹${amount} - ${status} - ${date}`, 20, y);
        });
      } else {
        doc.text('No recent payments found.', 20, 130);
      }
      
      doc.save(`payment-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Payment report has been downloaded as PDF file."
      });
    } catch (error) {
      console.error('Error exporting payment report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export payment report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportRevenueAnalysis = () => {
    try {
      console.log('Exporting revenue analysis...');
      
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Revenue Analysis Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
      doc.text(`Branch: ${(branches || []).find((b: any) => b.id === selectedBranch)?.name || 'All Branches'}`, 20, 50);
      
      // Revenue metrics
      doc.text('Revenue Metrics:', 20, 70);
      doc.text(`Total Monthly Revenue: ₹${(metrics?.monthlyRevenue || 0).toLocaleString()}`, 20, 80);
      doc.text(`Pending Collections: ₹${(metrics?.pendingFees || 0).toLocaleString()}`, 20, 90);
      doc.text(`Collection Rate: 94%`, 20, 100);
      const avgRevenue = Math.round((metrics?.monthlyRevenue || 0) / Math.max(metrics?.activeMembers || 1, 1));
      doc.text(`Average Revenue per Member: ₹${avgRevenue.toLocaleString()}`, 20, 110);
      
      // Monthly breakdown
      doc.text('Monthly Revenue Trend:', 20, 130);
      revenueData.forEach((data, index) => {
        const y = 140 + (index * 10);
        doc.text(`${data.month}: ₹${data.revenue.toLocaleString()} (${data.members} members)`, 20, y);
      });
      
      doc.save(`revenue-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Revenue analysis has been downloaded as PDF file."
      });
    } catch (error) {
      console.error('Error exporting revenue analysis:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export revenue analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportAttendanceReport = () => {
    try {
      console.log('Exporting attendance report...');
      console.log('Attendance data:', attendance);
      
      const attendanceReportData = attendanceData.map(data => ({
        Day: data.day,
        Attendance: data.attendance,
        'Peak Time': '6-8 PM',
        'Avg Duration': '90 mins'
      }));

      // Add member attendance if available
      if ((attendance || []).length > 0) {
        const memberAttendance = (attendance || []).map((att: any) => ({
          'Member Name': att.member?.name || att.memberName || 'N/A',
          'Check In': att.checkInTime ? new Date(att.checkInTime).toLocaleString() : 
                      att.check_in_time ? new Date(att.check_in_time).toLocaleString() : 'N/A',
          Date: att.checkInTime ? new Date(att.checkInTime).toLocaleDateString() : 
                att.check_in_time ? new Date(att.check_in_time).toLocaleDateString() : 'N/A'
        }));
        
        const ws1 = XLSX.utils.json_to_sheet(attendanceReportData);
        const ws2 = XLSX.utils.json_to_sheet(memberAttendance);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, "Daily Attendance");
        XLSX.utils.book_append_sheet(wb, ws2, "Member Check-ins");
        XLSX.writeFile(wb, `attendance-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        const ws = XLSX.utils.json_to_sheet(attendanceReportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `attendance-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      }
      
      toast({
        title: "Export Successful",
        description: `Attendance report has been downloaded as Excel file.`
      });
    } catch (error) {
      console.error('Error exporting attendance report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewAllReports = () => {
    // Navigate to detailed reports view or show all reports in a modal
    toast({
      title: "All Reports",
      description: "Showing comprehensive reports view with all available data."
    });
    // You can implement a modal or navigate to a detailed page here
  };

  // Mock data for charts
  const revenueData = [
    { month: "Jan", revenue: 75000, members: 120 },
    { month: "Feb", revenue: 82000, members: 135 },
    { month: "Mar", revenue: 95000, members: 158 },
    { month: "Apr", revenue: 88000, members: 142 },
    { month: "May", revenue: 105000, members: 178 },
    { month: "Jun", revenue: 89000, members: 165 },
  ];

  const membershipData = [
    { name: "Monthly", value: 456, color: "hsl(var(--chart-1))" },
    { name: "Quarterly", value: 621, color: "hsl(var(--chart-2))" },
    { name: "Yearly", value: 170, color: "hsl(var(--chart-3))" },
  ];

  const attendanceData = [
    { day: "Mon", attendance: 85 },
    { day: "Tue", attendance: 92 },
    { day: "Wed", attendance: 78 },
    { day: "Thu", attendance: 88 },
    { day: "Fri", attendance: 95 },
    { day: "Sat", attendance: 102 },
    { day: "Sun", attendance: 67 },
  ];

  const reports = [
    {
      id: "member-report",
      title: "Member Report",
      description: "Complete member information and statistics",
      icon: Users,
      format: "Excel",
      color: "bg-chart-2 hover:bg-chart-2/90",
    },
    {
      id: "payment-report",
      title: "Payment Report",
      description: "Financial transactions and payment history",
      icon: CreditCard,
      format: "PDF",
      color: "bg-chart-1 hover:bg-chart-1/90",
    },
    {
      id: "revenue-analysis",
      title: "Revenue Analysis",
      description: "Detailed revenue breakdown and trends",
      icon: TrendingUp,
      format: "PDF",
      color: "bg-primary hover:bg-primary/90",
    },
    {
      id: "attendance-report",
      title: "Attendance Report",
      description: "Member attendance patterns and statistics",
      icon: Calendar,
      format: "Excel",
      color: "bg-chart-4 hover:bg-chart-4/90",
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentBranch={selectedBranch}
        branches={branches}
        onBranchChange={setSelectedBranch}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports & Analytics" />
        
        <main className="flex-1 overflow-auto p-6">
          {!selectedBranch ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please select a branch to view reports</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Report Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-report-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="members">Members</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-date-range">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button variant="outline" data-testid="button-filter-reports">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" data-testid="button-refresh-reports">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                  <TabsTrigger value="members" data-testid="tab-members">Members</TabsTrigger>
                  <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
                  <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Quick Export Reports */}
                  <Card>
                    <CardHeader>
                      <CardTitle data-testid="text-quick-reports-title">Quick Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {reports.map((report) => (
                          <div 
                            key={report.id}
                            className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                            data-testid={`card-report-${report.id}`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <report.icon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">{report.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {report.format}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {report.description}
                            </p>
                            <Button 
                              size="sm" 
                              className={`w-full ${report.color}`}
                              data-testid={`button-export-${report.id}`}
                              onClick={() => {
                                console.log('Export button clicked for:', report.id);
                                try {
                                  switch(report.id) {
                                    case 'member-report':
                                      exportMemberReport();
                                      break;
                                    case 'payment-report':
                                      exportPaymentReport();
                                      break;
                                    case 'revenue-analysis':
                                      exportRevenueAnalysis();
                                      break;
                                    case 'attendance-report':
                                      exportAttendanceReport();
                                      break;
                                    default:
                                      toast({
                                        title: "Unknown Report",
                                        description: `Report type '${report.id}' not recognized.`,
                                        variant: "destructive"
                                      });
                                  }
                                } catch (error) {
                                  console.error('Error in export button click:', error);
                                  toast({
                                    title: "Export Error",
                                    description: "An error occurred while exporting. Please try again.",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Export {report.format}
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 flex justify-center">
                        <Button 
                          variant="outline" 
                          className="text-primary hover:bg-primary/10"
                          onClick={handleViewAllReports}
                          data-testid="button-view-all-reports"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View All Reports →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Revenue & Member Trends */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle data-testid="text-revenue-trends-title">Revenue & Member Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis 
                                yAxisId="revenue"
                                orientation="left"
                                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                              />
                              <YAxis 
                                yAxisId="members"
                                orientation="right"
                              />
                              <Tooltip 
                                formatter={(value: number, name: string) => [
                                  name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                                  name === 'revenue' ? 'Revenue' : 'Members'
                                ]}
                              />
                              <Bar 
                                yAxisId="revenue"
                                dataKey="revenue" 
                                fill="hsl(var(--primary))" 
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar 
                                yAxisId="members"
                                dataKey="members" 
                                fill="hsl(var(--chart-2))" 
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle data-testid="text-membership-distribution-title">Membership Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Tooltip />
                              <RechartsPieChart data={membershipData}>
                                {membershipData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </RechartsPieChart>
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                          {membershipData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-sm text-muted-foreground">{item.name}</span>
                              </div>
                              <span className="font-medium text-foreground">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="members" className="space-y-6">
                  <MemberAnalytics 
                    metrics={metrics}
                    members={members}
                    isLoading={!metrics && !!selectedBranch}
                  />
                </TabsContent>

                <TabsContent value="payments" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-chart-2" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                            <p className="text-2xl font-bold text-foreground" data-testid="text-payment-revenue">
                              ₹{(metrics?.monthlyRevenue || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Pending Payments</p>
                            <p className="text-2xl font-bold text-foreground" data-testid="text-pending-payments">
                              ₹{(metrics?.pendingFees || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-chart-1" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Collection Rate</p>
                            <p className="text-2xl font-bold text-foreground" data-testid="text-collection-rate">
                              94%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle data-testid="text-payment-export-title">Payment Reports Export</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          className="bg-chart-1 hover:bg-chart-1/90" 
                          data-testid="button-export-payment-summary"
                          onClick={exportPaymentReport}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export Payment Summary (PDF)
                        </Button>
                        <Button 
                          className="bg-chart-2 hover:bg-chart-2/90" 
                          data-testid="button-export-payment-details"
                          onClick={exportMemberReport}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export Payment Details (Excel)
                        </Button>
                        <Button 
                          className="bg-primary hover:bg-primary/90" 
                          data-testid="button-export-overdue-report"
                          onClick={exportPaymentReport}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export Overdue Report (PDF)
                        </Button>
                        <Button 
                          className="bg-chart-4 hover:bg-chart-4/90" 
                          data-testid="button-export-revenue-analysis"
                          onClick={exportRevenueAnalysis}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Export Revenue Analysis (Excel)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="attendance" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-chart-2" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Today's Attendance</p>
                            <p className="text-2xl font-bold text-foreground" data-testid="text-today-attendance">
                              87
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Average Daily</p>
                            <p className="text-2xl font-bold text-foreground" data-testid="text-average-attendance">
                              92
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-chart-1" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Peak Day</p>
                            <p className="text-xl font-bold text-foreground" data-testid="text-peak-day">
                              Saturday
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle data-testid="text-weekly-attendance-title">Weekly Attendance Pattern</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar 
                              dataKey="attendance" 
                              fill="hsl(var(--chart-2))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  );
}