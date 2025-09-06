import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import AttendanceScanner from "@/components/attendance-scanner";
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
import { Search, QrCode, Clock, Calendar, Users, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
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

  const { data: todayAttendance, isLoading } = useQuery({
    queryKey: ["/api/attendance/today", selectedBranch],
    enabled: !!selectedBranch,
  });

  const { data: members } = useQuery({
    queryKey: ["/api/members", selectedBranch],
    enabled: !!selectedBranch,
  });

  // Set first branch as default
  useEffect(() => {
    if (branches?.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const checkInMutation = useMutation({
    mutationFn: async (qrCodeId: string) => {
      const res = await apiRequest("POST", "/api/attendance/checkin", { qrCodeId });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today", selectedBranch] });
      toast({
        title: "Check-in Successful",
        description: `${data.member.name} has been checked in successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAttendance = todayAttendance?.filter((record: any) => {
    const memberData = members?.find((m: any) => m.id === record.memberId);
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
        <Header title="Attendance Tracking" />
        
        <main className="flex-1 overflow-auto p-6">
          {!selectedBranch ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please select a branch to view attendance</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-chart-2" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Today's Check-ins</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-today-checkins">
                          {todayAttendance?.length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Peak Hour</p>
                        <p className="text-xl font-bold text-foreground" data-testid="text-peak-hour">
                          6:00 PM
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
                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        <p className="text-xl font-bold text-foreground" data-testid="text-attendance-rate">
                          {members && todayAttendance ? 
                            Math.round((todayAttendance.length / members.length) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-4/10 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-chart-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">This Week</p>
                        <p className="text-xl font-bold text-foreground" data-testid="text-week-attendance">
                          156
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* QR Scanner */}
                <div className="lg:col-span-1">
                  <AttendanceScanner 
                    onScan={(qrCodeId) => checkInMutation.mutate(qrCodeId)}
                    isProcessing={checkInMutation.isPending}
                  />
                </div>

                {/* Today's Attendance */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle data-testid="text-todays-attendance-title">
                          Today's Attendance ({filteredAttendance.length})
                        </CardTitle>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-attendance"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                          <p className="text-muted-foreground">Loading attendance...</p>
                        </div>
                      ) : filteredAttendance.length === 0 ? (
                        <div className="text-center py-8">
                          <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No attendance records for today</p>
                          <p className="text-sm text-muted-foreground">Members can check in using QR scanner</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Check-in Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredAttendance.map((record: any) => {
                                const memberData = members?.find((m: any) => m.id === record.memberId);
                                return (
                                  <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>
                                            {memberData ? getInitials(memberData.name) : 'M'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-foreground" data-testid={`text-member-name-${record.id}`}>
                                            {memberData?.name || 'Unknown Member'}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            ID: {memberData?.qrCodeId}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell data-testid={`text-checkin-time-${record.id}`}>
                                      {formatTime(record.checkInTime)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant="default" 
                                        className="bg-chart-2 hover:bg-chart-2/90"
                                        data-testid={`badge-status-${record.id}`}
                                      >
                                        Checked In
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        data-testid={`button-view-member-${record.id}`}
                                      >
                                        View Profile
                                      </Button>
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
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
