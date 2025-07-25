import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { steamLookupRequestSchema, type SteamLookupRequest, type SteamLookupResponse, platformLookupRequestSchema, type PlatformLookupRequest, type PlatformLookupResponse, type Platform } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Clock, 
  User, 
  Gamepad2, 
  Trophy, 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Settings,
  ExternalLink,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { SiSteam, SiPlaystation } from "react-icons/si";
import { PSNTokenExpired } from "@/components/PSNTokenExpired";

export default function Home() {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [results, setResults] = useState<PlatformLookupResponse | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("steam");
  const [showPSNTokenExpired, setShowPSNTokenExpired] = useState(false);
  const { toast } = useToast();

  const form = useForm<PlatformLookupRequest>({
    resolver: zodResolver(platformLookupRequestSchema),
    defaultValues: {
      gamerTag: "",
      platform: "steam",
    },
  });

  // Initialize gamer tag from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    if (tag) {
      form.setValue('gamerTag', decodeURIComponent(tag));
    }
  }, [form]);

  const lookupMutation = useMutation({
    mutationFn: async (data: PlatformLookupRequest) => {
      const response = await apiRequest("POST", "/api/platform/lookup", data);
      return response.json() as Promise<PlatformLookupResponse>;
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Success!",
        description: `Found ${data.platform} profile for ${data.player.displayName}`,
      });
      
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-container')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "An error occurred while fetching data";
      
      // Check if it's a PSN token expiry error
      if (selectedPlatform === "playstation" && errorMessage.includes("Invalid NPSSO token")) {
        setShowPSNTokenExpired(true);
        return;
      }
      
      toast({
        title: "Error",
        description: errorMessage.split('\n').map((line: string, index: number) => (
          <div key={index}>{line}</div>
        )),
        variant: "destructive",
      });
      setResults(null);
    },
  });

  const onSubmit = (data: PlatformLookupRequest) => {
    const submissionData = { ...data, platform: selectedPlatform };
    lookupMutation.mutate(submissionData);
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case "steam": return <SiSteam className="text-steam-blue" />;
      case "playstation": return <SiPlaystation className="text-blue-500" />;
      case "xbox": return <Gamepad2 className="text-green-500" />;
    }
  };

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case "steam": return "text-steam-blue";
      case "playstation": return "text-blue-500";
      case "xbox": return "text-green-500";
    }
  };

  const copyToClipboard = (data: string) => {
    navigator.clipboard.writeText(data).then(() => {
      toast({
        title: "Copied!",
        description: "Gaming data copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    });
  };

  const exportAsJSON = () => {
    if (!results) return;
    const jsonData = JSON.stringify(results, null, 2);
    copyToClipboard(jsonData);
  };

  const exportAsCSV = () => {
    if (!results) return;
    const yearlyHours = Math.round(results.totalHours / 3);
    const dailyAverage = Math.round(yearlyHours / 365);
    
    let csv = "Metric,Value\n";
    csv += `"Total Hours",${results.totalHours}\n`;
    csv += `"Hours Per Year",${yearlyHours}\n`;
    csv += `"Daily Average Hours",${dailyAverage}\n`;
    csv += `"Total Games",${results.totalGames}\n`;
    csv += `"Average Hours Per Game",${results.avgHoursPerGame}\n`;
    csv += "\nGame,Hours Played,Platform,Last Played\n";
    results.topGames.forEach(game => {
      csv += `"${game.name}",${game.hoursPlayed},${game.platform},"${game.lastPlayed || 'N/A'}"\n`;
    });
    copyToClipboard(csv);
  };

  const handlePSNTokenRefresh = async (newToken: string) => {
    try {
      const response = await apiRequest("POST", "/api/platform/psn-refresh-token", { 
        npsso: newToken 
      });
      
      if (response.ok) {
        // Retry the original lookup
        const gamerTag = form.getValues('gamerTag');
        if (gamerTag) {
          lookupMutation.mutate({ gamerTag, platform: 'playstation' });
        }
      } else {
        throw new Error('Failed to refresh PSN token');
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-steam-dark text-white">
      {/* Header */}
      <header className="bg-steam-surface shadow-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-3">
            {getPlatformIcon(selectedPlatform)}
            <h1 className="text-xl font-semibold text-white">Gamer Tag Lookup</h1>
            <div className="flex space-x-2 opacity-50">
              <SiSteam className="text-sm" />
              <SiPlaystation className="text-sm" />
              <Gamepad2 className="text-sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        {/* Setup Instructions Card */}
        <Card className="bg-steam-surface border-gray-800 mb-6">
          <CardContent className="p-4">
            <Collapsible open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full mb-3">
                <h2 className="text-lg font-semibold flex items-center text-white">
                  <Info className="text-steam-blue mr-2 h-5 w-5" />
                  Setup Required
                </h2>
                {isInstructionsOpen ? (
                  <ChevronUp className="text-steam-blue h-5 w-5" />
                ) : (
                  <ChevronDown className="text-steam-blue h-5 w-5" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="text-sm text-gray-300 space-y-3">
                  <Alert className="bg-yellow-900/20 border-yellow-600/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-200" />
                    <AlertDescription className="text-yellow-200">
                      <p className="font-medium mb-2">✅ Steam API Key Configured</p>
                      <p className="text-xs mb-2">The app is ready to fetch real Steam data!</p>
                      <p className="text-xs"><strong>Try searching:</strong> "gaben" or "robbaz" (known public profiles)</p>
                    </AlertDescription>
                  </Alert>
                  <Alert className="bg-red-900/20 border-red-600/30">
                    <AlertTriangle className="h-4 w-4 text-red-200" />
                    <AlertDescription className="text-red-200">
                      <p className="font-medium mb-2">🔒 Privacy Settings Required</p>
                      <p className="text-xs mb-2">If you get "profile is private" errors, you need to:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Open Steam client → Settings → Privacy Settings</li>
                        <li>Set "My Profile" to Public</li>
                        <li>Set "Game Details" to Public</li>
                        <li>Wait 5-10 minutes for changes to take effect</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Search Form */}
        <Card className="bg-steam-surface border-gray-800 mb-6">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="platform" className="block text-sm font-medium text-gray-300 mb-2">
                    <Gamepad2 className="inline mr-1 h-4 w-4" />
                    Gaming Platform
                  </Label>
                  <Select value={selectedPlatform} onValueChange={(value: Platform) => setSelectedPlatform(value)}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="steam" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <SiSteam className="text-steam-blue" />
                          <span>Steam</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="playstation" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <SiPlaystation className="text-blue-500" />
                          <span>PlayStation</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="xbox" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <Gamepad2 className="text-green-500" />
                          <span>Xbox</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="gamerTag" className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="inline mr-1 h-4 w-4" />
                    Gamer Tag
                  </Label>
                  <div className="relative">
                    <Input
                      id="gamerTag"
                      type="text"
                      placeholder={selectedPlatform === "steam" ? "Enter Steam ID or custom URL" : `Enter ${selectedPlatform} gamer tag`}
                      className="w-full px-4 py-3 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-steam-blue focus:border-transparent pr-10"
                      {...form.register("gamerTag")}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                  {form.formState.errors.gamerTag && (
                    <p className="text-red-400 text-sm mt-1">{form.formState.errors.gamerTag.message}</p>
                  )}
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={lookupMutation.isPending}
                className={`w-full font-semibold py-3 px-6 text-white ${getPlatformColor(selectedPlatform) === "text-steam-blue" ? "bg-steam-blue hover:bg-blue-600" : getPlatformColor(selectedPlatform) === "text-blue-500" ? "bg-blue-500 hover:bg-blue-600" : "bg-green-500 hover:bg-green-600"} disabled:bg-gray-600 disabled:cursor-not-allowed`}
              >
                {lookupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    Look Up Gaming Stats
                    <Clock className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Display */}
        {results && (
          <div id="results-container" className="space-y-4">
            {/* Player Profile Card */}
            <Card className="bg-steam-surface border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={results.player.avatar} alt={results.player.displayName} />
                    <AvatarFallback className="bg-gray-700">
                      <User className="text-gray-400 text-xl" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon(results.platform)}
                      <h2 className="text-xl font-semibold text-white">
                        {results.player.displayName}
                      </h2>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {results.platform.charAt(0).toUpperCase() + results.platform.slice(1)} ID: {results.player.id}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Gamer Tag: {results.player.gamerTag}
                    </p>
                  </div>
                </div>
                

                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Total Hours Played</span>
                      <span className="text-steam-accent font-bold text-lg">
                        {results.totalHours.toLocaleString()} hrs
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Hours Per Year</span>
                      <span className="text-green-400 font-bold text-lg">
                        {Math.round(results.totalHours / 3)} hrs/year
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Estimated based on gaming activity
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Daily Average</span>
                      <span className="text-blue-400 font-semibold">
                        {Math.round((results.totalHours / 3) / 365)} hrs/day
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Last Online</span>
                      <span className="text-gray-300 text-sm">
                        {results.player.lastOnline}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportAsJSON}
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    Copy JSON
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportAsCSV}
                    className="text-white border-gray-600 hover:bg-gray-700"
                  >
                    Copy CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Top Games Card */}
            <Card className="bg-steam-surface border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <Trophy className="text-yellow-500 mr-2 h-5 w-5" />
                  Top 3 Most Played Games
                </h3>
                
                <div className="space-y-3">
                  {results.topGames.map((game, index) => (
                    <div key={game.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                          <Gamepad2 className="text-gray-400 h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{game.name}</p>
                          <p className="text-gray-400 text-xs">Game ID: {game.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-steam-accent">{game.hoursPlayed} hrs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats Card */}
            <Card className="bg-steam-surface border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <BarChart3 className="text-steam-blue mr-2 h-5 w-5" />
                  Gaming Stats
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-steam-accent">{results.totalGames}</p>
                    <p className="text-gray-400 text-sm">Total Games</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-steam-accent">{results.avgHoursPerGame}</p>
                    <p className="text-gray-400 text-sm">Avg hrs/Game</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-8 pb-4">
          <p>Powered by <a href="https://prestigiouspaths.com" className="text-steam-blue hover:underline" target="_blank" rel="noopener noreferrer">Prestigious Paths</a></p>
        </footer>
      </main>

      {/* PSN Token Expired Modal */}
      <PSNTokenExpired
        isOpen={showPSNTokenExpired}
        onTokenRefresh={handlePSNTokenRefresh}
        onClose={() => setShowPSNTokenExpired(false)}
      />
    </div>
  );
}
