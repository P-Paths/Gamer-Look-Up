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
import { steamLookupRequestSchema, type SteamLookupRequest, type SteamLookupResponse } from "@shared/schema";
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
import { SiSteam } from "react-icons/si";

export default function Home() {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [results, setResults] = useState<SteamLookupResponse | null>(null);
  const { toast } = useToast();

  const form = useForm<SteamLookupRequest>({
    resolver: zodResolver(steamLookupRequestSchema),
    defaultValues: {
      gamerTag: "",
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
    mutationFn: async (data: SteamLookupRequest) => {
      const response = await apiRequest("POST", "/api/steam/lookup", data);
      return response.json() as Promise<SteamLookupResponse>;
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Success!",
        description: `Found Steam profile for ${data.player.personaname}`,
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
      const errorMessage = error.message || "An error occurred while fetching Steam data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setResults(null);
    },
  });

  const onSubmit = (data: SteamLookupRequest) => {
    lookupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-steam-dark text-white">
      {/* Header */}
      <header className="bg-steam-surface shadow-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-3">
            <SiSteam className="text-steam-blue text-2xl" />
            <h1 className="text-xl font-semibold text-white">Steam Hours Lookup</h1>
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
                      <p className="font-medium mb-2">⚠️ Steam API Key Required</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Visit <a href="https://steamcommunity.com/dev/apikey" className="text-steam-blue hover:underline" target="_blank" rel="noopener noreferrer">Steam API Key Page <ExternalLink className="inline h-3 w-3" /></a></li>
                        <li>Log in with your Steam account</li>
                        <li>Enter any domain name (e.g., localhost)</li>
                        <li>Copy your API key</li>
                        <li>Add it to your backend configuration</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                  <Alert className="bg-blue-900/20 border-blue-600/30">
                    <Settings className="h-4 w-4 text-blue-200" />
                    <AlertDescription className="text-blue-200">
                      <p className="font-medium mb-2">🔧 Backend Setup</p>
                      <p className="text-xs">Configure your Node.js backend with the Steam API key as STEAM_API_KEY environment variable.</p>
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
              <div className="relative">
                <Label htmlFor="gamerTag" className="block text-sm font-medium text-gray-300 mb-2">
                  <Gamepad2 className="inline mr-1 h-4 w-4" />
                  Steam Gamer Tag
                </Label>
                <div className="relative">
                  <Input
                    id="gamerTag"
                    type="text"
                    placeholder="Enter Steam ID or custom URL"
                    className="w-full px-4 py-3 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-steam-blue focus:border-transparent pr-10"
                    {...form.register("gamerTag")}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
                {form.formState.errors.gamerTag && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.gamerTag.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={lookupMutation.isPending}
                className="w-full bg-steam-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6"
              >
                {lookupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    Look Up Hours
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
                    <AvatarImage src={results.player.avatarfull} alt={results.player.personaname} />
                    <AvatarFallback className="bg-gray-700">
                      <User className="text-gray-400 text-xl" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {results.player.personaname}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Steam ID: {results.player.steamid}
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
                      <span className="text-gray-300 text-sm">Last Online</span>
                      <span className="text-gray-300 text-sm">
                        {results.lastLogoffFormatted}
                      </span>
                    </div>
                  </div>
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
                    <div key={game.appid} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                          {game.img_icon_url ? (
                            <img 
                              src={`https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`}
                              alt={game.name}
                              className="w-8 h-8 rounded"
                            />
                          ) : (
                            <Gamepad2 className="text-gray-400 h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{game.name}</p>
                          <p className="text-gray-400 text-xs">App ID: {game.appid}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-steam-accent">{game.playtime_forever} hrs</p>
                        {game.playtime_2weeks > 0 && (
                          <p className="text-gray-400 text-xs">{game.playtime_2weeks} hrs past 2 weeks</p>
                        )}
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
          <p>Powered by <a href="https://developer.valvesoftware.com/wiki/Steam_Web_API" className="text-steam-blue hover:underline" target="_blank" rel="noopener noreferrer">Steam Web API <ExternalLink className="inline h-3 w-3" /></a></p>
          <p className="mt-2">This tool requires a valid Steam API key to function</p>
        </footer>
      </main>
    </div>
  );
}
