import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
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
import { Search, Plus, Filter, UserCheck, UserX, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Members() {
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

  const filteredMembers = members?.filter((member: any) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  ) || [];

  const getStatusBadge = (status: string, membershipEnd: string) => {
    const endDate = new Date(membershipEnd);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "expired" || daysUntilExpiry < 0) {
      return <Badge variant="destructive" data-testid={`badge-status-expired`}>Expired</Badge>;
    } else if (daysUntilExpiry <= 7) {
      return <Badge variant="outline" className="border-destructive text-destructive" data-testid={`badge-status-expiring`}>
        Expiring Soon
      </Badge>;
    } else if (status === "active") {
      return <Badge variant="default" className="bg-chart-2 hover:bg-chart-2/90" data-testid={`badge-status-active`}>
        Active
      </Badge>;
    } else {
      return <Badge variant="secondary" data-testid={`badge-status-inactive`}>Inactive</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      monthly: "bg-blue-100 text-blue-800",
      quarterly: "bg-green-100 text-green-800", 
      yearly: "bg-purple-100 text-purple-800"
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentBranch={selectedBranch}
        branches={branches}
        onBranchChange={setSelectedBranch}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Members Management" />
        
        <main className="flex-1 overflow-auto p-6">
          {!selectedBranch ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please select a branch to view members</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-members"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" data-testid="button-filter-members">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button data-testid="button-add-member">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-chart-2" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Members</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-active-members-count">
                          {filteredMembers.filter((m: any) => m.status === 'active').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expiring Soon</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-expiring-members-count">
                          {filteredMembers.filter((m: any) => {
                            const daysUntilExpiry = Math.ceil((new Date(m.membershipEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
                          }).length}
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
                        <p className="text-2xl font-bold text-foreground" data-testid="text-inactive-members-count">
                          {filteredMembers.filter((m: any) => m.status === 'inactive').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Members Table */}
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-members-table-title">
                    All Members ({filteredMembers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading members...</p>
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No members found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Membership End</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMembers.map((member: any) => (
                            <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-foreground" data-testid={`text-member-name-${member.id}`}>
                                      {member.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">ID: {member.qrCodeId}</p>
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
                              <TableCell>
                                {getStatusBadge(member.status, member.membershipEnd)}
                              </TableCell>
                              <TableCell data-testid={`text-member-end-date-${member.id}`}>
                                {new Date(member.membershipEnd).toLocaleDateString()}
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
                                    data-testid={`button-edit-member-${member.id}`}
                                  >
                                    Edit
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
