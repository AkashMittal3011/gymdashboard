import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Mail, Megaphone, Users, Send, Bell } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";

interface CommunicationPanelProps {
  selectedBranch: string;
}

interface AnnouncementForm {
  subject: string;
  message: string;
}

export default function CommunicationPanel({ selectedBranch }: CommunicationPanelProps) {
  const { toast } = useToast();
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnnouncementForm>();

  // Fetch members for the selected branch
  const { data: members } = useQuery<any[]>({
    queryKey: ["/api/members", selectedBranch],
    enabled: !!selectedBranch,
  });

  // Fetch pending payments for reminders
  const { data: pendingPayments } = useQuery<any[]>({
    queryKey: ["/api/payments/pending", selectedBranch],
    enabled: !!selectedBranch,
  });

  // Fetch communications for announcements
  const { data: communications } = useQuery<any[]>({
    queryKey: ["/api/communications", selectedBranch],
    enabled: !!selectedBranch,
  });

  const sendPaymentRemindersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/communications", {
        branchId: selectedBranch,
        type: "whatsapp",
        subject: "Payment Reminder",
        message: "Your membership payment is due. Please pay to continue enjoying our services.",
        status: "sent"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications", selectedBranch] });
      toast({
        title: "Reminders Sent",
        description: `Payment reminders sent to ${(pendingPayments || []).length} members via WhatsApp.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Could not send payment reminders. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendReceiptsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/communications", {
        branchId: selectedBranch,
        type: "email",
        subject: "Payment Receipt",
        message: "Thank you for your payment. Your receipt has been generated and sent to your email.",
        status: "sent"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications", selectedBranch] });
      toast({
        title: "Receipts Sent",
        description: `Payment receipts sent to all members via email.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Could not send receipts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendNewsletterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/communications", {
        branchId: selectedBranch,
        type: "email",
        subject: "Monthly Newsletter",
        message: "Check out our latest updates, new equipment, classes, and special offers!",
        status: "sent"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications", selectedBranch] });
      toast({
        title: "Newsletter Sent",
        description: `Newsletter sent to ${(members || []).length} members via email.`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Could not send newsletter. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementForm) => {
      const res = await apiRequest("POST", "/api/communications", {
        branchId: selectedBranch,
        type: "announcement",
        subject: data.subject,
        message: data.message,
        status: "sent"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications", selectedBranch] });
      toast({
        title: "Announcement Created",
        description: "Your announcement has been published successfully.",
      });
      reset();
      setIsAnnouncementOpen(false);
    },
    onError: () => {
      toast({
        title: "Failed to Create",
        description: "Could not create announcement. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendPaymentReminders = () => {
    if (!(pendingPayments || []).length) {
      toast({
        title: "No Pending Payments",
        description: "There are no pending payments to send reminders for.",
        variant: "destructive",
      });
      return;
    }
    sendPaymentRemindersMutation.mutate();
  };

  const handleSendReceipts = () => {
    if (!(members || []).length) {
      toast({
        title: "No Members",
        description: "There are no members to send receipts to.",
        variant: "destructive",
      });
      return;
    }
    sendReceiptsMutation.mutate();
  };

  const handleSendNewsletter = () => {
    if (!(members || []).length) {
      toast({
        title: "No Members",
        description: "There are no members to send newsletter to.",
        variant: "destructive",
      });
      return;
    }
    sendNewsletterMutation.mutate();
  };

  const onSubmitAnnouncement = (data: AnnouncementForm) => {
    createAnnouncementMutation.mutate(data);
  };

  const announcements = (communications || []).filter((c: any) => c.type === "announcement");
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle data-testid="text-communication-panel-title">Communication Center</CardTitle>
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
                onClick={handleSendPaymentReminders}
                disabled={sendPaymentRemindersMutation.isPending}
              >
                <Send className="h-3 w-3 mr-2" />
                {sendPaymentRemindersMutation.isPending ? "Sending..." : "Send Payment Reminders"}
              </Button>
              <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full border-chart-2 text-chart-2 hover:bg-chart-2/10"
                    data-testid="button-whatsapp-announcement"
                  >
                    <Megaphone className="h-3 w-3 mr-2" />
                    Send Announcement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmitAnnouncement)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        data-testid="input-announcement-subject"
                        {...register("subject", { required: "Subject is required" })}
                        placeholder="Enter announcement subject"
                      />
                      {errors.subject && (
                        <p className="text-sm text-destructive">{errors.subject.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        data-testid="textarea-announcement-message"
                        {...register("message", { required: "Message is required" })}
                        placeholder="Enter your announcement..."
                        rows={4}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message.message}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={createAnnouncementMutation.isPending}
                        data-testid="button-submit-announcement"
                      >
                        {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAnnouncementOpen(false)}
                        data-testid="button-cancel-announcement"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                onClick={handleSendReceipts}
                disabled={sendReceiptsMutation.isPending}
              >
                <Mail className="h-3 w-3 mr-2" />
                {sendReceiptsMutation.isPending ? "Sending..." : "Send Receipts"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-chart-1 text-chart-1 hover:bg-chart-1/10"
                data-testid="button-email-newsletter"
                onClick={handleSendNewsletter}
                disabled={sendNewsletterMutation.isPending}
              >
                <Send className="h-3 w-3 mr-2" />
                {sendNewsletterMutation.isPending ? "Sending..." : "Send Newsletter"}
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
              <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="w-full"
                    data-testid="button-create-announcement"
                  >
                    <Megaphone className="h-3 w-3 mr-2" />
                    Create Announcement
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    data-testid="button-view-announcements"
                  >
                    <Bell className="h-3 w-3 mr-2" />
                    View All
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>All Announcements ({announcements.length})</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {announcements.length === 0 ? (
                      <div className="text-center py-8">
                        <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No announcements found</p>
                        <p className="text-sm text-muted-foreground">Create your first announcement to get started</p>
                      </div>
                    ) : (
                      announcements.map((announcement: any) => (
                        <div key={announcement.id} className="p-4 border rounded-lg" data-testid={`announcement-${announcement.id}`}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-foreground" data-testid={`announcement-subject-${announcement.id}`}>
                              {announcement.subject}
                            </h4>
                            <span className="text-xs text-muted-foreground" data-testid={`announcement-date-${announcement.id}`}>
                              {new Date(announcement.sentAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground" data-testid={`announcement-message-${announcement.id}`}>
                            {announcement.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">Communication Guidelines</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• WhatsApp messages are best for urgent reminders and quick updates</li>
            <li>• Email is ideal for detailed information, receipts, and newsletters</li>
            <li>• Announcements are visible to all members in the app dashboard</li>
            <li>• Always personalize messages when possible for better engagement</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
