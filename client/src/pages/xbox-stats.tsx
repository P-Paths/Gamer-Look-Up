import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, Trophy, Gamepad2, TrendingUp, Users, Medal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlayerProfile {
  xuid: string;
  gamertag: string;
  displayName: string;
  gamerscore: number;
  avatar: string;
  isOnline: boolean;
  currentActivity: string;
  lastSeen: string;
  accountTier: string;
  reputation: string;
}

interface GameStats {
  name: string;
  titleId: string;
  lastTimePlayed: string;
  achievement?: any;
  stats?: any;
}

interface PlayerStats {
  profile: PlayerProfile;
  recentGames: GameStats[];
  achievementHighlights: any[];
  stats: {
    totalGames: number;
    totalAchievements: number;
    gamerscore: number;
  };
}

export default function XboxStats() {
  const [searchTerm, setSearchTerm] = useState("");
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [comparePlayer1, setComparePlayer1] = useState("");
  const [comparePlayer2, setComparePlayer2] = useState("");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [loading, setLoading] = useState({
    search: false,
    compare: false
  });
  const { toast } = useToast();

  const searchPlayerStats = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(prev => ({ ...prev, search: true }));
    try {
      const response = await fetch('/api/xbox/player-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamertag: searchTerm.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPlayerStats(data.playerStats);
        toast({
          title: "Player Found",
          description: `Retrieved stats for ${data.playerStats.profile.gamertag}`
        });
      } else {
        toast({
          title: "Player Not Found",
          description: data.error || "Failed to find Xbox player",
          variant: "destructive"
        });
        setPlayerStats(null);
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to search Xbox Live",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const comparePlayers = async () => {
    if (!comparePlayer1.trim() || !comparePlayer2.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both gamertags to compare",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(prev => ({ ...prev, compare: true }));
    try {
      const response = await fetch('/api/xbox/compare-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gamertag1: comparePlayer1.trim(),
          gamertag2: comparePlayer2.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setComparisonResult(data.comparison);
        toast({
          title: "Comparison Complete",
          description: `Compared ${comparePlayer1} vs ${comparePlayer2}`
        });
      } else {
        toast({
          title: "Comparison Failed",
          description: data.error || "Failed to compare players",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to compare players",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, compare: false }));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const PlayerStatsCard = ({ stats }: { stats: PlayerStats }) => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={stats.profile.avatar} alt={stats.profile.gamertag} />
              <AvatarFallback>{stats.profile.gamertag.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{stats.profile.gamertag}</h2>
                {stats.profile.isOnline && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Online
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Gamerscore</p>
                  <p className="font-semibold text-lg">{stats.profile.gamerscore.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Games Played</p>
                  <p className="font-semibold text-lg">{stats.stats.totalGames}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account Tier</p>
                  <p className="font-semibold">{stats.profile.accountTier}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reputation</p>
                  <p className="font-semibold">{stats.profile.reputation}</p>
                </div>
              </div>
              
              {stats.profile.currentActivity && (
                <div className="mt-3">
                  <Badge variant="outline">{stats.profile.currentActivity}</Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Games */}
      {stats.recentGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Recent Games ({stats.recentGames.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {stats.recentGames.slice(0, 10).map((game, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{game.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last played: {formatDate(game.lastTimePlayed)}
                    </p>
                  </div>
                  {game.achievement && (
                    <Badge variant="secondary">
                      <Trophy className="h-3 w-3 mr-1" />
                      {game.achievement.currentAchievements || 0}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Highlights */}
      {stats.achievementHighlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Achievement Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {stats.achievementHighlights.map((gameAchievements, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">{gameAchievements.gameName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {gameAchievements.achievements?.length || 0} achievements tracked
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const ComparisonCard = ({ comparison }: { comparison: any }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Player Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gamerscore Comparison */}
        <div>
          <h4 className="font-medium mb-3">Gamerscore Battle</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={comparison.player1.profile.avatar} />
                <AvatarFallback>{comparison.player1.profile.gamertag.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <p className="font-semibold">{comparison.player1.profile.gamertag}</p>
              <p className="text-2xl font-bold text-green-600">
                {comparison.player1.profile.gamerscore.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarImage src={comparison.player2.profile.avatar} />
                <AvatarFallback>{comparison.player2.profile.gamertag.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <p className="font-semibold">{comparison.player2.profile.gamertag}</p>
              <p className="text-2xl font-bold text-blue-600">
                {comparison.player2.profile.gamerscore.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-center mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Trophy className="h-4 w-4 mr-2" />
              Winner: {comparison.comparison.gamerscoreWinner}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Difference: {comparison.comparison.gamerscoreDifference.toLocaleString()} points
            </p>
          </div>
        </div>

        {/* Games Played Comparison */}
        <div>
          <h4 className="font-medium mb-3">Games Library</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xl font-bold">{comparison.player1.stats.totalGames}</p>
              <p className="text-sm text-muted-foreground">games</p>
            </div>
            <div>
              <p className="text-xl font-bold">{comparison.player2.stats.totalGames}</p>
              <p className="text-sm text-muted-foreground">games</p>
            </div>
          </div>
          <div className="text-center mt-2">
            <Badge variant="secondary">
              Most Games: {comparison.comparison.gamesPlayedWinner}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Xbox Player Statistics</h1>
        <p className="text-muted-foreground">
          Look up detailed Xbox Live statistics for any gamertag, compare players, and analyze gaming achievements.
        </p>
      </div>

      <Tabs defaultValue="lookup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lookup" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Player Lookup
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Compare Players
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lookup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Xbox Player</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Xbox gamertag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPlayerStats()}
                />
                <Button onClick={searchPlayerStats} disabled={loading.search || !searchTerm.trim()}>
                  {loading.search ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {playerStats && <PlayerStatsCard stats={playerStats} />}
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compare Two Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="First player's gamertag..."
                  value={comparePlayer1}
                  onChange={(e) => setComparePlayer1(e.target.value)}
                />
                <Input
                  placeholder="Second player's gamertag..."
                  value={comparePlayer2}
                  onChange={(e) => setComparePlayer2(e.target.value)}
                />
              </div>
              <Button 
                onClick={comparePlayers} 
                disabled={loading.compare || !comparePlayer1.trim() || !comparePlayer2.trim()}
                className="w-full"
              >
                {loading.compare ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                Compare Players
              </Button>
            </CardContent>
          </Card>

          {comparisonResult && <ComparisonCard comparison={comparisonResult} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}