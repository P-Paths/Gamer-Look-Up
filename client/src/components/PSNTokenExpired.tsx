import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ExternalLink, Gamepad2, RefreshCw, Copy, CheckCircle } from "lucide-react";
import { SiPlaystation } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface PSNTokenExpiredProps {
  isOpen: boolean;
  onTokenRefresh: (newToken: string) => void;
  onClose: () => void;
}

export function PSNTokenExpired({ isOpen, onTokenRefresh, onClose }: PSNTokenExpiredProps) {
  const [newToken, setNewToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const handleTokenSubmit = async () => {
    if (!newToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your NPSSO token",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onTokenRefresh(newToken.trim());
      toast({
        title: "PSN Reconnected!",
        description: "Your PlayStation data connection has been restored",
      });
      setNewToken("");
      setStep(1);
      onClose();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please check your token and try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInstructions = () => {
    const instructions = `1. Go to https://my.playstation.com
2. Sign into your PlayStation account
3. Open Developer Tools (F12)
4. Go to Application tab → Storage → Cookies
5. Find "npsso" cookie and copy its value`;
    
    navigator.clipboard.writeText(instructions);
    toast({
      title: "Instructions Copied",
      description: "Token extraction steps copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <SiPlaystation className="text-blue-500" />
            <span>PlayStation Connection Expired</span>
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Your PSN authentication token has expired. Reconnect to continue accessing your PlayStation data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 1 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="text-yellow-500 h-5 w-5" />
                  <span>Token Refresh Required</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  NPSSO tokens expire regularly for security. You need to get a fresh token from PlayStation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-900/20 border-blue-600/30">
                  <Gamepad2 className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300">
                    <p className="font-medium mb-2">Why does this happen?</p>
                    <p className="text-sm">PlayStation NPSSO tokens expire every 30-60 days for security. This is normal and expected behavior.</p>
                  </AlertDescription>
                </Alert>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setStep(2)} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Get New Token
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={copyInstructions}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Steps
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Get Your NPSSO Token</CardTitle>
                <CardDescription className="text-gray-300">
                  Follow these steps to extract your authentication token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-medium">Open PlayStation website</p>
                      <a 
                        href="https://my.playstation.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                      >
                        https://my.playstation.com <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-medium">Sign into your PlayStation account</p>
                      <p className="text-gray-400">Use your PSN credentials</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-medium">Open Developer Tools</p>
                      <p className="text-gray-400">Press F12 or right-click → Inspect</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <p className="font-medium">Navigate to cookies</p>
                      <p className="text-gray-400">Application tab → Storage → Cookies → https://my.playstation.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
                    <div>
                      <p className="font-medium">Find and copy "npsso" cookie value</p>
                      <p className="text-gray-400">Copy the entire value (long string)</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setStep(3)} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I've Got My Token
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Enter Your NPSSO Token</CardTitle>
                <CardDescription className="text-gray-300">
                  Paste the token value you copied from the PlayStation website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="npsso-token" className="text-sm font-medium text-gray-300">
                    NPSSO Token
                  </Label>
                  <Input
                    id="npsso-token"
                    type="password"
                    placeholder="Paste your NPSSO token here..."
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                
                <Alert className="bg-yellow-900/20 border-yellow-600/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-300 text-sm">
                    Your token is encrypted and stored securely. We never store your PlayStation password.
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setStep(2)} 
                    variant="outline"
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleTokenSubmit}
                    disabled={isSubmitting || !newToken.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        Reconnect PSN
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}