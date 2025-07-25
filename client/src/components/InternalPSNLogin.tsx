import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { psnInternalLoginSchema, type PSNInternalLoginRequest } from "@shared/schema";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  Lock
} from "lucide-react";
import { SiPlaystation } from "react-icons/si";

interface InternalPSNLoginProps {
  onSuccess?: () => void;
}

export function InternalPSNLogin({ onSuccess }: InternalPSNLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<PSNInternalLoginRequest>({
    resolver: zodResolver(psnInternalLoginSchema),
    defaultValues: {
      username: "",
      password: "",
      userId: "default",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: PSNInternalLoginRequest) => {
      const response = await apiRequest("POST", "/api/psn/internal-login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "PSN Login Successful!",
          description: "NPSSO token has been automatically extracted and stored",
        });
        form.reset();
        onSuccess?.();
      } else {
        throw new Error(data.error || "Login failed");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PSNInternalLoginRequest) => {
    loginMutation.mutate(data);
  };

  return (
    <Card className="bg-gray-900 border-red-600/30 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-400">
          <Shield className="h-5 w-5" />
          <span>Internal PSN Login</span>
        </CardTitle>
        <CardDescription className="text-gray-400">
          Staff use only - Automated PlayStation login via Puppeteer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-red-900/20 border-red-600/30">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300 text-sm">
            <p className="font-medium mb-1">⚠️ Internal Use Only</p>
            <ul className="text-xs space-y-1">
              <li>• This feature is for staff and internal testing only</li>
              <li>• Never expose this to production users</li>
              <li>• Credentials are processed securely via Puppeteer</li>
              <li>• 2FA accounts may require manual intervention</li>
            </ul>
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-sm font-medium text-gray-300">
              PlayStation Username/Email
            </Label>
            <Input
              id="username"
              type="email"
              {...form.register('username')}
              placeholder="your-email@example.com"
              className="mt-1 bg-gray-800 border-gray-600 text-white"
              disabled={loginMutation.isPending}
            />
            {form.formState.errors.username && (
              <p className="text-red-400 text-sm mt-1">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-300">
              PlayStation Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...form.register('password')}
                placeholder="Enter your PlayStation password"
                className="bg-gray-800 border-gray-600 text-white pr-10"
                disabled={loginMutation.isPending}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loginMutation.isPending}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-red-400 text-sm mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Alert className="bg-blue-900/20 border-blue-600/30">
            <Lock className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              <p className="font-medium mb-1">How it works:</p>
              <ol className="text-xs space-y-1 list-decimal list-inside">
                <li>Puppeteer opens a headless browser</li>
                <li>Navigates to PlayStation login page</li>
                <li>Enters your credentials securely</li>
                <li>Extracts NPSSO token from cookies</li>
                <li>Stores token for PlayStation API access</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Automating Login...
              </>
            ) : (
              <>
                <SiPlaystation className="w-4 h-4 mr-2" />
                Automate PSN Login
              </>
            )}
          </Button>

          {loginMutation.isSuccess && (
            <Alert className="bg-green-900/20 border-green-600/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 text-sm">
                Login automation completed successfully! NPSSO token has been stored.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            This feature uses Puppeteer to automate browser interactions.<br />
            Only use with accounts you own or have explicit permission to access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}