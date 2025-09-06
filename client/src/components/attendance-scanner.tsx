import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Camera, Keyboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttendanceScannerProps {
  onScan: (qrCodeId: string) => void;
  isProcessing?: boolean;
}

export default function AttendanceScanner({ onScan, isProcessing }: AttendanceScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput("");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  return (
    <Card className="shadow-sm" data-testid="card-attendance-scanner">
      <CardHeader>
        <CardTitle data-testid="text-scanner-title">Member Check-in</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" data-testid="tab-manual-input">
              <Keyboard className="h-4 w-4 mr-2" />
              Manual Input
            </TabsTrigger>
            <TabsTrigger value="camera" data-testid="tab-camera-scan">
              <Camera className="h-4 w-4 mr-2" />
              Camera Scan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-code-input">Member QR Code ID</Label>
                <Input
                  id="qr-code-input"
                  data-testid="input-qr-code"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter or scan QR code ID"
                  disabled={isProcessing}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!manualInput.trim() || isProcessing}
                data-testid="button-manual-checkin"
              >
                {isProcessing ? "Processing..." : "Check In Member"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            <div className="text-center space-y-4">
              {!isCameraActive ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8">
                  <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Use camera to scan member QR codes
                  </p>
                  <Button 
                    onClick={startCamera}
                    data-testid="button-start-camera"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border border-border"
                    data-testid="video-camera-feed"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={stopCamera}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-stop-camera"
                    >
                      Stop Camera
                    </Button>
                    <Button 
                      className="flex-1"
                      disabled={isProcessing}
                      data-testid="button-capture-qr"
                    >
                      {isProcessing ? "Processing..." : "Capture QR"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">Quick Instructions</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Members can scan their QR code to check in</li>
            <li>• Use manual input for backup check-in</li>
            <li>• Camera mode works with QR scanner apps</li>
            <li>• All check-ins are logged with timestamp</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
