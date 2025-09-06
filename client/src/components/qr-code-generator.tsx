import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface QRCodeGeneratorProps {
  branchId: string;
  currentQRCode?: string;
  todayRegistrations?: number;
  weekRegistrations?: number;
}

export default function QRCodeGenerator({ 
  branchId, 
  currentQRCode, 
  todayRegistrations = 0, 
  weekRegistrations = 0 
}: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/qr/generate/${branchId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/branch", branchId] });
      toast({
        title: "QR Code Generated",
        description: "New registration QR code has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePrint = () => {
    if (currentQRCode) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Member Registration QR Code</title></head>
            <body style="text-align: center; padding: 20px;">
              <h2>Scan to Register as Member</h2>
              <img src="${currentQRCode}" alt="Registration QR Code" style="max-width: 300px;" />
              <p>FitManage Pro - Gym Management System</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (currentQRCode) {
      const link = document.createElement('a');
      link.href = currentQRCode;
      link.download = 'gym-registration-qr.png';
      link.click();
    }
  };

  return (
    <Card className="shadow-sm" data-testid="card-qr-generator">
      <CardHeader>
        <CardTitle data-testid="text-qr-title">QR Member Registration</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="flex justify-center">
          {currentQRCode ? (
            <img 
              src={currentQRCode} 
              alt="Registration QR Code" 
              className="w-32 h-32 border-2 border-dashed border-border rounded-lg"
              data-testid="img-qr-code"
            />
          ) : (
            <div className="w-32 h-32 bg-secondary border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No QR Code</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Registration QR Code</p>
          <p className="text-xs text-muted-foreground">Scan to register new members</p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => generateQRMutation.mutate()}
            disabled={generateQRMutation.isPending}
            className="w-full"
            data-testid="button-generate-qr"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${generateQRMutation.isPending ? 'animate-spin' : ''}`} />
            {generateQRMutation.isPending ? "Generating..." : "Regenerate QR Code"}
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handlePrint}
              disabled={!currentQRCode}
              className="flex-1"
              data-testid="button-print-qr"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={!currentQRCode}
              className="flex-1"
              data-testid="button-download-qr"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today's Registrations:</span>
            <span className="font-medium text-foreground" data-testid="text-today-registrations">
              {todayRegistrations}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">This Week:</span>
            <span className="font-medium text-foreground" data-testid="text-week-registrations">
              {weekRegistrations}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
