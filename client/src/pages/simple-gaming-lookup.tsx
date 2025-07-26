import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, GamepadIcon, Clock, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GameData {
  name: string;
  hoursPlayed: number;
  lastPlayed?: string;
  isCurrentlyPlaying?: boolean;
}

interface ProfileData {
  platform: string;
  gamerTag?: string;
  steamId?: string;
  displayName: string;
  totalGames: number;
  totalHours: number;
  games: GameData[];
  lastOnline?: string;
  currentActivity?: string;
  isOnline?: boolean;
  dataSource: string;
}

export default function SimpleGamingLookup() {
  const [platform, setPlatform] = useState<string>("");
  const [gamerTag, setGamerTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!platform || !gamerTag.trim()) {
      setError("Please select a platform and enter a gamer tag");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let endpoint = "";
      switch (platform) {
        case "steam":
          endpoint = "/api/steam/real-data";
          break;
        case "xbox":
          endpoint = "/api/xbox/real-data";
          break;
        case "playstation":
          endpoint = "/api/playstation/real-data";
          break;
        default:
          throw new Error("Invalid platform selected");
      }

      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ gamerTag: gamerTag.trim() }),
        headers: { "Content-Type": "application/json" }
      });

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || "Failed to fetch gaming data");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const formatLastPlayed = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Real Gaming Data Lookup</h1>
        <p className="text-muted-foreground">
          Get authentic gaming statistics: hours played, last activity, and current games
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Gaming Profile</CardTitle>
          <CardDescription>
            Select platform and enter exact gamer tag to get real gaming data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="steam">Steam</SelectItem>
                <SelectItem value="xbox">Xbox Live</SelectItem>
                <SelectItem value="playstation">PlayStation</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Enter gamer tag or Steam username"
              value={gamerTag}
              onChange={(e) => setGamerTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            
            <Button onClick={handleSearch} disabled={loading || !platform || !gamerTag.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GamepadIcon className="h-5 w-5" />
                  {result.displayName}
                </CardTitle>
                <CardDescription>
                  {result.platform.charAt(0).toUpperCase() + result.platform.slice(1)} Profile
                  {result.isOnline && <Badge className="ml-2 bg-green-500">Online</Badge>}
                </CardDescription>
              </div>
              <Badge variant="outline">{result.dataSource}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Games</p>
                <p className="text-2xl font-bold">{result.totalGames}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Hours</p>
                <p className="text-2xl font-bold">{result.totalHours.toLocaleString()}</p>
              </div>
            </div>

            {result.currentActivity && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium text-blue-800">Currently Playing</p>
                <p className="text-blue-900">{result.currentActivity}</p>
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      {result?.games && result.games.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>Games with actual play time and last activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.games.slice(0, 10).map((game, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <h3 className="font-medium">{game.name}</h3>
                    {game.isCurrentlyPlaying && (
                      <Badge className="mt-1 bg-green-500">Playing Now</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{game.hoursPlayed}h</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatLastPlayed(game.lastPlayed)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}