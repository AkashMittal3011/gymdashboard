import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Megaphone, Users, Send, Bell } from "lucide-react";

interface CommunicationPanelProps {
  selectedBranch: string;
}

export default function CommunicationPanel({ selectedBranch }: CommunicationPanelProps) {
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
              >
                <Send className="h-3 w-3 mr-2" />
                Send Payment Reminders
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-chart-2 text-chart-2 hover:bg-chart-2/10"
                data-testid="button-whatsapp-announcement"
              >
                <Megaphone className="h-3 w-3 mr-2" />
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
                <Mail className="h-3 w-3 mr-2" />
                Send Receipts
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-chart-1 text-chart-1 hover:bg-chart-1/10"
                data-testid="button-email-newsletter"
              >
                <Send className="h-3 w-3 mr-2" />
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
                <Megaphone className="h-3 w-3 mr-2" />
                Create Announcement
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                data-testid="button-view-announcements"
              >
                <Bell className="h-3 w-3 mr-2" />
                View All
              </Button>
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
