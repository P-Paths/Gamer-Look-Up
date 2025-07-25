import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InternalPSNLogin } from "@/components/InternalPSNLogin";
import { ArrowLeft, Shield, AlertTriangle } from "lucide-react";

export default function InternalPage() {
  const [, setLocation] = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-red-600/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="flex items-center space-x-3">
              <Shield className="text-red-500 text-xl" />
              <h1 className="text-xl font-semibold text-red-400">Internal Tools</h1>
            </div>
            
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Warning Banner */}
        <Alert className="bg-red-900/20 border-red-600/30 mb-6">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            <p className="font-medium mb-2">🚨 RESTRICTED ACCESS - STAFF ONLY</p>
            <p className="text-sm">
              This page contains internal tools for staff use only. These features should never be exposed to production users.
              All actions are logged and monitored.
            </p>
          </AlertDescription>
        </Alert>

        {/* Tools Overview */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Available Internal Tools</CardTitle>
            <CardDescription>
              Automation and testing utilities for staff and development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white mb-1">PlayStation Auto-Login</h3>
                      <p className="text-sm text-gray-400">
                        Automated NPSSO token extraction using Puppeteer
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>• Headless browser automation</span>
                        <span>• Secure credential handling</span>
                        <span>• Automatic token storage</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowLogin(!showLogin)}
                      variant={showLogin ? "destructive" : "outline"}
                      size="sm"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                    >
                      {showLogin ? "Hide" : "Show"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600 opacity-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white mb-1">Xbox Live Auto-Auth</h3>
                      <p className="text-sm text-gray-400">
                        Automated Xbox authentication (Coming Soon)
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>• OAuth2 automation</span>
                        <span>• Token refresh handling</span>
                        <span>• Secure storage</span>
                      </div>
                    </div>
                    <Button
                      disabled
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-500"
                    >
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600 opacity-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white mb-1">Steam API Manager</h3>
                      <p className="text-sm text-gray-400">
                        Advanced Steam API testing and rate limiting (Coming Soon)
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>• Rate limit monitoring</span>
                        <span>• Bulk data fetching</span>
                        <span>• Performance analytics</span>
                      </div>
                    </div>
                    <Button
                      disabled
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-500"
                    >
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* PSN Auto-Login Tool */}
        {showLogin && (
          <div className="space-y-4">
            <Alert className="bg-yellow-900/20 border-yellow-600/30">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-300 text-sm">
                <p className="font-medium mb-1">Before Using This Tool:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Ensure you have permission to automate the PlayStation account</li>
                  <li>2FA-enabled accounts may require manual intervention</li>
                  <li>This process takes 30-60 seconds to complete</li>
                  <li>Never use this with user credentials in production</li>
                </ul>
              </AlertDescription>
            </Alert>

            <InternalPSNLogin 
              onSuccess={() => {
                setShowLogin(false);
              }}
            />
          </div>
        )}

        {/* Usage Guidelines */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-red-400">Security Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
              <p>Only use these tools with accounts you own or have explicit permission to access</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
              <p>Never expose internal automation endpoints to production users</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
              <p>All automation activity is logged and monitored for security purposes</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
              <p>Report any suspicious activity or unauthorized access immediately</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}