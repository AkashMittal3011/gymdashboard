import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import CommunicationPanel from "@/components/communication-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  MessageCircle, Mail, Megaphone, Send, Search,
  Users, Calendar, CheckCircle, AlertCircle, Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommunicationSchema } from "@shared/schema";
import { z } from "zod";

const communicationFormSchema = insertCommunicationSchema.extend({
  branchId: z.string().min(1, "Branch is required"),
});

type CommunicationFormData = z.infer<typeof communicationFormSchema>;

export default function Communication() {
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

  const { data: communications, isLoading } = useQuery({
    queryKey: ["/api/communications", selectedBranch],
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

  const form = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      branchId: selectedBranch,
      type: "announcement",
      subject: "",
      message: "",
      status: "pending",
    },
  });

  useEffect(() => {
    if (selectedBranch) {
      form.setValue("branchId", selectedBranch);
    }
  }, [selectedBranch, form]);

  const sendCommunicationMutation = useMutation({
    mutationFn: async (data: CommunicationFormData) => {
      const res = await apiRequest("POST", "/api/communications", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications", selectedBranch] });
      toast({
        title: "Message Sent",
        description: "Your communication has been sent successfully.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommunicationFormData) => {
    sendCommunicationMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { variant: "default" as const, className: "bg-chart-2 hover:bg-chart-2/90", icon: CheckCircle },
      pending: { variant: "outline" as const, className: "border-chart-4 text-chart-4", icon: Clock },
      failed: { variant: "destructive" as const, className: "", icon: AlertCircle },
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "whatsapp":
        return <MessageCircle className="h-4 w-4 text-chart-2" />;
      case "email":
        return <Mail className="h-4 w-4 text-chart-1" />;
      default:
        return <Megaphone className="h-4 w-4 text-primary" />;
    }
  };

  const filteredCommunications = communications?.filter((comm: any) =>
    comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.message.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentBranch={selectedBranch}
        branches={branches}
        onBranchChange={setSelectedBranch}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Communication Center" />
        
        <main className="flex-1 overflow-auto p-6">
          {!selectedBranch ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please select a branch to manage communications</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Communication Panel */}
              <CommunicationPanel selectedBranch={selectedBranch} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Message Composer */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle data-testid="text-compose-title">Compose Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Message Type</Label>
                          <Select 
                            value={form.watch("type")} 
                            onValueChange={(value) => form.setValue("type", value)}
                          >
                            <SelectTrigger data-testid="select-message-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="announcement">Announcement</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            data-testid="input-subject"
                            {...form.register("subject")}
                            placeholder="Enter message subject"
                          />
                          {form.formState.errors.subject && (
                            <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            data-testid="textarea-message"
                            {...form.register("message")}
                            placeholder="Enter your message..."
                            rows={5}
                          />
                          {form.formState.errors.message && (
                            <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
                          )}
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={sendCommunicationMutation.isPending}
                          data-testid="button-send-message"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {sendCommunicationMutation.isPending ? "Sending..." : "Send Message"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle data-testid="text-communication-stats-title">Communication Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Messages Sent Today</span>
                        <span className="font-semibold text-foreground" data-testid="text-messages-today">
                          {communications?.filter((c: any) => {
                            const sentDate = new Date(c.sentAt);
                            const today = new Date();
                            return sentDate.toDateString() === today.toDateString();
                          }).length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">This Week</span>
                        <span className="font-semibold text-foreground" data-testid="text-messages-week">
                          {communications?.filter((c: any) => {
                            const sentDate = new Date(c.sentAt);
                            const sevenDaysAgo = new Date();
                            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                            return sentDate >= sevenDaysAgo;
                          }).length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Members</span>
                        <span className="font-semibold text-foreground" data-testid="text-total-members">
                          {members?.length || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Communication History */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle data-testid="text-communication-history-title">
                          Communication History ({filteredCommunications.length})
                        </CardTitle>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search communications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-communications"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                          <p className="text-muted-foreground">Loading communications...</p>
                        </div>
                      ) : filteredCommunications.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No communications found</p>
                          <p className="text-sm text-muted-foreground">Start by sending your first message</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Sent</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCommunications.map((comm: any) => (
                                <TableRow key={comm.id} data-testid={`row-communication-${comm.id}`}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getTypeIcon(comm.type)}
                                      <span className="capitalize text-sm font-medium" data-testid={`text-type-${comm.id}`}>
                                        {comm.type}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <p className="font-medium text-foreground" data-testid={`text-subject-${comm.id}`}>
                                      {comm.subject || "No Subject"}
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm text-muted-foreground truncate max-w-xs" data-testid={`text-message-${comm.id}`}>
                                      {comm.message}
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(comm.status)}
                                  </TableCell>
                                  <TableCell data-testid={`text-sent-date-${comm.id}`}>
                                    {new Date(comm.sentAt).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      data-testid={`button-view-communication-${comm.id}`}
                                    >
                                      View
                                    </Button>
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
