import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Globe,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { SiPlaystation } from "react-icons/si";

interface PSNMultiSourceResult {
  platform: string;
  player: {
    id: string;
    gamerTag: string;
    displayName: string;
    avatar: string;
    lastOnline: string;
  };
  totalHours: number;
  totalGames: number;
  avgHoursPerGame: number;
  topGames: Array<{
    name: string;
    hoursPlayed: number;
    platform: string;
    lastPlayed: string;
  }>;
  qualificationStatus: string;
  qualificationReason: string;
  realData: boolean;
  dataSource: 'official_api' | 'psnprofiles_scraper' | 'combined';
  dataQuality: 'excellent' | 'good' | 'fair' | 'limited';
  dataFreshness: 'real_time' | 'recent' | 'cached';
  trophies: {
    level: number;
    progress: number;
    totalTrophies: number;
    platinum: number;
    gold: number;
    silver: number;
    bronze: number;
    trophyScore: number;
    category: string;
  };
}

export default function PSNMultiTestPage() {
  const [gamerTag, setGamerTag] = useState("");
  const [result, setResult] = useState<PSNMultiSourceResult | null>(null);
  const { toast } = useToast();

  const multiSourceMutation = useMutation({
    mutationFn: async (gamerTag: string) => {
      const response = await apiRequest("POST", "/api/platform/psn-multi-source", { gamerTag });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "PlayStation Data Retrieved!",
        description: `Successfully got ${data.dataQuality} quality data from ${data.dataSource}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Data Retrieval Failed",
        description: error.message || "All PlayStation data sources failed",
        variant: "destructive",
      });
      setResult(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gamerTag.trim()) {
      multiSourceMutation.mutate(gamerTag.trim());
    }
  };

  const getDataSourceIcon = (source: string) => {
    switch (source) {
      case 'official_api': return <Zap className="h-4 w-4" />;
      case 'psnprofiles_scraper': return <Globe className="h-4 w-4" />;
      case 'combined': return <Database className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'limited': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'real_time': return 'text-green-400';
      case 'recent': return 'text-blue-400';
      case 'cached': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-blue-600/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SiPlaystation className="text-blue-500 text-2xl" />
              <h1 className="text-2xl font-bold text-blue-400">PlayStation Multi-Source Test</h1>
            </div>
            <Badge variant="outline" className="border-blue-500 text-blue-400">
              Real Data Sources
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Test Interface */}
        <Card className="bg-gray-900 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-400" />
              <span>Multi-Source PlayStation Lookup</span>
            </CardTitle>
            <CardDescription>
              Tests all available PlayStation data sources to retrieve real gaming statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="gamerTag" className="text-sm font-medium text-gray-300">
                  PSN Online ID / Gamer Tag
                </Label>
                <Input
                  id="gamerTag"
                  type="text"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  placeholder="Enter PlayStation gamer tag (e.g., lazaruz_729)"
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                  disabled={multiSourceMutation.isPending}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={multiSourceMutation.isPending || !gamerTag.trim()}
              >
                {multiSourceMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing All Sources...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Get PlayStation Data
                  </>
                )}
              </Button>
            </form>

            {/* Data Source Strategy */}
            <Alert className="mt-4 bg-blue-900/20 border-blue-600/30">
              <Target className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                <p className="font-medium mb-2">Multi-Source Strategy:</p>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li><strong>Official PSN API</strong> - Real-time data via psn-api library</li>
                  <li><strong>PSNProfiles Scraping</strong> - Community trophy database</li>
                  <li><strong>Combined Approach</strong> - Fallback data aggregation</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            {/* Data Source Info */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    {getDataSourceIcon(result.dataSource)}
                    <span>Data Source: {result.dataSource.replace('_', ' ').toUpperCase()}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge className={getQualityColor(result.dataQuality)}>
                      {result.dataQuality}
                    </Badge>
                    <Badge variant="outline" className={getFreshnessColor(result.dataFreshness)}>
                      {result.dataFreshness.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Data Quality:</span>
                    <p className="font-medium">{result.dataQuality.charAt(0).toUpperCase() + result.dataQuality.slice(1)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Freshness:</span>
                    <p className="font-medium">{result.dataFreshness.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Real Data:</span>
                    <p className="font-medium flex items-center">
                      {result.realData ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                          Yes
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-400 mr-1" />
                          No
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Player Profile */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SiPlaystation className="h-5 w-5 text-blue-400" />
                  <span>PlayStation Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  {result.player.avatar && (
                    <img 
                      src={result.player.avatar} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full border-2 border-blue-500"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">{result.player.displayName}</h3>
                    <p className="text-gray-400">@{result.player.gamerTag}</p>
                    <p className="text-sm text-gray-500">Last seen: {result.player.lastOnline}</p>
                  </div>
                </div>

                {/* Trophy Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{result.trophies.level}</div>
                    <div className="text-sm text-gray-400">Trophy Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{result.trophies.totalTrophies}</div>
                    <div className="text-sm text-gray-400">Total Trophies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{result.totalHours}</div>
                    <div className="text-sm text-gray-400">Total Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{result.totalGames}</div>
                    <div className="text-sm text-gray-400">Games Played</div>
                  </div>
                </div>

                {/* Trophy Breakdown */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-800 rounded">
                    <Trophy className="h-4 w-4 text-yellow-300 mx-auto mb-1" />
                    <div className="text-sm font-bold">{result.trophies.platinum}</div>
                    <div className="text-xs text-gray-400">Platinum</div>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded">
                    <Trophy className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                    <div className="text-sm font-bold">{result.trophies.gold}</div>
                    <div className="text-xs text-gray-400">Gold</div>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded">
                    <Trophy className="h-4 w-4 text-gray-300 mx-auto mb-1" />
                    <div className="text-sm font-bold">{result.trophies.silver}</div>
                    <div className="text-xs text-gray-400">Silver</div>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded">
                    <Trophy className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                    <div className="text-sm font-bold">{result.trophies.bronze}</div>
                    <div className="text-xs text-gray-400">Bronze</div>
                  </div>
                </div>

                {/* Trophy Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Trophy Progress</span>
                    <span className="text-gray-300">{result.trophies.progress}%</span>
                  </div>
                  <Progress value={result.trophies.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Games */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GamepadIcon className="h-5 w-5 text-green-400" />
                  <span>Top Games</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.topGames.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold text-blue-400">#{index + 1}</div>
                        <div>
                          <h4 className="font-medium text-white">{game.name}</h4>
                          <p className="text-sm text-gray-400">Platform: {game.platform}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-green-400">
                          <Clock className="h-4 w-4 mr-1" />
                          {game.hoursPlayed}h
                        </div>
                        <div className="text-xs text-gray-500">
                          Last: {new Date(game.lastPlayed).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Summary */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Statistics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-blue-400">{result.avgHoursPerGame}h</div>
                    <div className="text-sm text-gray-400">Avg Hours/Game</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-green-400">{result.trophies.trophyScore}</div>
                    <div className="text-sm text-gray-400">Trophy Score</div>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded">
                    <div className={`text-2xl font-bold ${result.qualificationStatus === 'qualified' ? 'text-green-400' : 'text-red-400'}`}>
                      {result.qualificationStatus.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-400">Status</div>
                  </div>
                </div>
                
                <Alert className="mt-4 bg-green-900/20 border-green-600/30">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300 text-sm">
                    <strong>Qualification:</strong> {result.qualificationReason}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}