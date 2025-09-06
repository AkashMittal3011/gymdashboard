import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import QRCodeGenerator from "@/components/qr-code-generator";
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
import { 
  Search, UserPlus, QrCode, Calendar, 
  Users, TrendingUp, Download, Share2 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function QRRegistration() {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: members, isLoading } = useQuery({
    queryKey: ["/api/members", selectedBranch],
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

  const getPlanBadge = (plan: string) => {
    const colors = {
      monthly: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      quarterly: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
      yearly: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };
    
    return (
      <Badge 
        variant="outline" 
        className={colors[plan as keyof typeof colors] || ""}
        data-testid={`badge-plan-${plan}`}
      >
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    );
  };

  // Filter recent registrations (last 30 days)
  const recentRegistrations = members?.filter((member: any) => {
    const memberDate = new Date(member.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    
    return memberDate >= thirtyDaysAgo && matchesSearch;
  }) || [];

  // Calculate registration stats
  const todayRegistrations = members?.filter((member: any) => {
    const memberDate = new Date(member.createdAt);
    const today = new Date();
    return memberDate.toDateString() === today.toDateString();
  }).length || 0;

  const weekRegistrations = members?.filter((member: any) => {
    const memberDate = new Date(member.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return memberDate >= sevenDaysAgo;
  }).length || 0;

  const monthRegistrations = recentRegistrations.length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentBranch={selectedBranch}
        branches={branches}
        onBranchChange={setSelectedBranch}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="QR Registration Management" />
        
        <main className="flex-1 overflow-auto p-6">
          {!selectedBranch ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please select a branch to manage QR registration</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Registration Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-chart-2" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Today</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-today-registrations">
                          {todayRegistrations}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">This Week</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-week-registrations">
                          {weekRegistrations}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-chart-1" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-month-registrations">
                          {monthRegistrations}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-4/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-chart-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Members</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-total-members">
                          {members?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* QR Code Generator */}
                <div className="lg:col-span-1">
                  <QRCodeGenerator
                    branchId={selectedBranch}
                    currentQRCode={currentBranch?.qrCodeUrl}
                    todayRegistrations={todayRegistrations}
                    weekRegistrations={weekRegistrations}
                  />

                  {/* QR Code Actions */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle data-testid="text-qr-actions-title">QR Code Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid="button-share-qr"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share QR Code
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid="button-download-poster"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Poster
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid="button-qr-analytics"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Registrations */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle data-testid="text-recent-registrations-title">
                          Recent Registrations ({recentRegistrations.length})
                        </CardTitle>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search registrations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-registrations"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                          <p className="text-muted-foreground">Loading registrations...</p>
                        </div>
                      ) : recentRegistrations.length === 0 ? (
                        <div className="text-center py-8">
                          <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No recent registrations</p>
                          <p className="text-sm text-muted-foreground">New members will appear here when they register via QR code</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentRegistrations.map((member: any) => (
                                <TableRow key={member.id} data-testid={`row-registration-${member.id}`}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-foreground" data-testid={`text-member-name-${member.id}`}>
                                          {member.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          ID: {member.qrCodeId}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="text-sm font-medium" data-testid={`text-member-phone-${member.id}`}>
                                        {member.phone}
                                      </p>
                                      {member.email && (
                                        <p className="text-sm text-muted-foreground" data-testid={`text-member-email-${member.id}`}>
                                          {member.email}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getPlanBadge(member.membershipPlan)}
                                  </TableCell>
                                  <TableCell data-testid={`text-registration-date-${member.id}`}>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {new Date(member.createdAt).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(member.createdAt).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        data-testid={`button-view-member-${member.id}`}
                                      >
                                        View
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        data-testid={`button-send-welcome-${member.id}`}
                                      >
                                        Welcome
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
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
