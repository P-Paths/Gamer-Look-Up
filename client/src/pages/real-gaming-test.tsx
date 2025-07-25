import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Trophy, 
  GamepadIcon, 
  Clock, 
  Target,
  Zap,
  Database,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Users,
  Star
} from "lucide-react";
import { SiPlaystation } from "react-icons/si";

interface RealGamingProfile {
  platform: 'playstation' | 'xbox';
  gamerTag: string;
  displayName: string;
  level?: number;
  gamerscore?: number;
  trophyLevel?: number;
  totalTrophies?: number;
  totalGames: number;
  totalHours: number;
  games: Array<{
    name: string;
    hoursPlayed: number;
    achievements?: number;
    trophies?: number;
    completionPercentage: number;
    lastPlayed: string;
  }>;
  achievements?: {
    total: number;
    unlocked: number;
    gamerscore: number;
  };
  trophies?: {
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
    total: number;
  };
  avatar?: string;
  dataSource: string;
  lastUpdated: string;
}

export default function RealGamingTestPage() {
  const [gamerTag, setGamerTag] = useState("");
  const [xboxResult, setXboxResult] = useState<RealGamingProfile | null>(null);
  const [playstationResult, setPlaystationResult] = useState<RealGamingProfile | null>(null);
  const { toast } = useToast();

  const xboxMutation = useMutation({
    mutationFn: async (gamerTag: string) => {
      const response = await apiRequest("POST", "/api/xbox/real-data", { gamerTag });
      return response.json();
    },
    onSuccess: (data) => {
      setXboxResult(data.data);
      toast({
        title: "Xbox Data Retrieved!",
        description: `Successfully got real Xbox data from ${data.dataSource}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Xbox Data Retrieval Failed",
        description: error.message || "Failed to get Xbox data",
        variant: "destructive",
      });
      setXboxResult(null);
    },
  });

  const playstationMutation = useMutation({
    mutationFn: async (gamerTag: string) => {
      const response = await apiRequest("POST", "/api/playstation/real-data", { gamerTag });
      return response.json();
    },
    onSuccess: (data) => {
      setPlaystationResult(data.data);
      toast({
        title: "PlayStation Data Retrieved!",
        description: `Successfully got real PlayStation data from ${data.dataSource}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "PlayStation Data Retrieval Failed",
        description: error.message || "Failed to get PlayStation data",
        variant: "destructive",
      });
      setPlaystationResult(null);
    },
  });

  const handleXboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gamerTag.trim()) {
      xboxMutation.mutate(gamerTag.trim());
    }
  };

  const handlePlayStationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gamerTag.trim()) {
      playstationMutation.mutate(gamerTag.trim());
    }
  };

  const getDataSourceIcon = (source: string) => {
    if (source.includes('trueachievements')) return <Target className="h-4 w-4" />;
    if (source.includes('openxbl')) return <Zap className="h-4 w-4" />;
    if (source.includes('psnprofiles')) return <Database className="h-4 w-4" />;
    return <Search className="h-4 w-4" />;
  };

  const ProfileCard = ({ profile, platform }: { profile: RealGamingProfile; platform: 'xbox' | 'playstation' }) => (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {platform === 'xbox' ? 
            <GamepadIcon className="h-5 w-5 text-green-400" /> : 
            <SiPlaystation className="h-5 w-5 text-blue-400" />
          }
          <span>{platform === 'xbox' ? 'Xbox' : 'PlayStation'} Profile</span>
          <Badge variant="outline" className="ml-auto">
            {getDataSourceIcon(profile.dataSource)}
            {profile.dataSource.replace('_', ' ')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-4">
          {profile.avatar && (
            <img 
              src={profile.avatar} 
              alt="Avatar" 
              className="w-16 h-16 rounded-full border-2 border-gray-600"
            />
          )}
          <div>
            <h3 className="text-xl font-bold text-white">{profile.displayName}</h3>
            <p className="text-gray-400">@{profile.gamerTag}</p>
            {platform === 'xbox' && profile.gamerscore && (
              <p className="text-green-400 font-medium">{profile.gamerscore.toLocaleString()} Gamerscore</p>
            )}
            {platform === 'playstation' && profile.trophyLevel && (
              <p className="text-blue-400 font-medium">Level {profile.trophyLevel}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-800 rounded">
            <div className="text-xl font-bold text-green-400">{profile.totalHours}h</div>
            <div className="text-sm text-gray-400">Total Hours</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded">
            <div className="text-xl font-bold text-blue-400">{profile.totalGames}</div>
            <div className="text-sm text-gray-400">Games</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded">
            <div className="text-xl font-bold text-purple-400">
              {Math.round(profile.totalHours / Math.max(profile.totalGames, 1))}h
            </div>
            <div className="text-sm text-gray-400">Avg/Game</div>
          </div>
        </div>

        {/* Xbox Achievements */}
        {platform === 'xbox' && profile.achievements && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-300 mb-2">Achievements</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-yellow-400">{profile.achievements.total}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <div className="text-lg font-bold text-green-400">{profile.achievements.unlocked}</div>
                <div className="text-xs text-gray-400">Unlocked</div>
              </div>
            </div>
          </div>
        )}

        {/* PlayStation Trophies */}
        {platform === 'playstation' && profile.trophies && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-300 mb-2">Trophies</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-gray-800 rounded">
                <Trophy className="h-4 w-4 text-yellow-300 mx-auto mb-1" />
                <div className="text-sm font-bold">{profile.trophies.platinum}</div>
                <div className="text-xs text-gray-400">Platinum</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <Trophy className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-sm font-bold">{profile.trophies.gold}</div>
                <div className="text-xs text-gray-400">Gold</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <Trophy className="h-4 w-4 text-gray-300 mx-auto mb-1" />
                <div className="text-sm font-bold">{profile.trophies.silver}</div>
                <div className="text-xs text-gray-400">Silver</div>
              </div>
              <div className="text-center p-2 bg-gray-800 rounded">
                <Trophy className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                <div className="text-sm font-bold">{profile.trophies.bronze}</div>
                <div className="text-xs text-gray-400">Bronze</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Games */}
        {profile.games.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-300 mb-2">Recent Games</h4>
            <div className="space-y-2">
              {profile.games.slice(0, 5).map((game, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <div>
                    <div className="font-medium text-white text-sm">{game.name}</div>
                    <div className="text-xs text-gray-400">
                      {game.achievements && `${game.achievements} achievements`}
                      {game.trophies && `${game.trophies} trophies`}
                      {game.completionPercentage > 0 && ` • ${game.completionPercentage}% complete`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-400">{game.hoursPlayed}h</div>
                    <div className="text-xs text-gray-500">
                      {new Date(game.lastPlayed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GamepadIcon className="text-green-500 text-2xl" />
              <h1 className="text-2xl font-bold text-white">Real Gaming Data Test</h1>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-400">
              Live Data Sources
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Test Interface */}
        <Card className="bg-gray-900 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-green-400" />
              <span>Real Gaming Data Lookup</span>
            </CardTitle>
            <CardDescription>
              Test real data retrieval from Xbox and PlayStation using proven scraping methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gamerTag" className="text-sm font-medium text-gray-300">
                  Gamer Tag / PSN ID
                </Label>
                <Input
                  id="gamerTag"
                  type="text"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  placeholder="Enter gamer tag (e.g., MajorNelson, lazaruz_729)"
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleXboxSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={xboxMutation.isPending || !gamerTag.trim()}
                >
                  {xboxMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Xbox Data...
                    </>
                  ) : (
                    <>
                      <GamepadIcon className="w-4 h-4 mr-2" />
                      Get Xbox Data
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handlePlayStationSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={playstationMutation.isPending || !gamerTag.trim()}
                >
                  {playstationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting PlayStation Data...
                    </>
                  ) : (
                    <>
                      <SiPlaystation className="w-4 h-4 mr-2" />
                      Get PlayStation Data
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Data Sources Info */}
            <Alert className="mt-4 bg-green-900/20 border-green-600/30">
              <Zap className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 text-sm">
                <p className="font-medium mb-2">Real Data Sources:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li><strong>Xbox:</strong> TrueAchievements, OpenXBL API, XboxGamertag scraping</li>
                  <li><strong>PlayStation:</strong> PSNProfiles public data scraping</li>
                  <li><strong>Note:</strong> Requires public profiles for scraping methods</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Xbox Results */}
          <div>
            {xboxResult ? (
              <ProfileCard profile={xboxResult} platform="xbox" />
            ) : (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GamepadIcon className="h-5 w-5 text-green-400" />
                    <span>Xbox Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-400">
                    <GamepadIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a gamer tag and click "Get Xbox Data" to see real Xbox profile information</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* PlayStation Results */}
          <div>
            {playstationResult ? (
              <ProfileCard profile={playstationResult} platform="playstation" />
            ) : (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SiPlaystation className="h-5 w-5 text-blue-400" />
                    <span>PlayStation Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-400">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter a PSN ID and click "Get PlayStation Data" to see real PlayStation profile information</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}