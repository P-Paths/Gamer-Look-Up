import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trophy, Gamepad2, Clock, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface PSNResult {
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
    id: string;
    name: string;
    hoursPlayed: number;
    platform: string;
    lastPlayed: string;
  }>;
  qualificationStatus: string;
  qualificationReason: string;
  realData?: boolean;
  scrapedData?: boolean;
  trophies?: {
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

export default function PSNTest() {
  const [npsso, setNpsso] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PSNResult | null>(null);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"api" | "scrape">("api");

  const testPSN = async () => {
    if (!npsso.trim()) {
      setError("Please enter your NPSSO token");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const endpoint = method === "api" ? "/api/platform/psn-real" : "/api/platform/psn-scrape";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ npsso: npsso.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "PlayStation lookup failed");
      }
    } catch (err) {
      setError("Network error - make sure the server is running");
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return hours < 100 ? `${hours.toFixed(1)}h` : `${Math.round(hours)}h`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Real PlayStation Data Test</h1>
          <p className="text-muted-foreground">
            Test the new NPSSO-based PlayStation API integration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>NPSSO Token Input</CardTitle>
            <CardDescription>
              Get your NPSSO token from PlayStation.com cookies (64-character string)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="npsso" className="text-sm font-medium">
                NPSSO Token:
              </label>
              <Textarea
                id="npsso"
                placeholder="Paste your 64-character NPSSO token here..."
                value={npsso}
                onChange={(e) => setNpsso(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setMethod("api")}
                variant={method === "api" ? "default" : "outline"}
                size="sm"
              >
                API Method
              </Button>
              <Button
                onClick={() => setMethod("scrape")}
                variant={method === "scrape" ? "default" : "outline"}
                size="sm"
              >
                Scraping Method
              </Button>
            </div>

            <Button
              onClick={testPSN}
              disabled={loading || !npsso.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {method === "api" ? "Fetching PlayStation Data..." : "Scraping PlayStation..."}
                </>
              ) : (
                <>
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  Test PlayStation {method === "api" ? "API" : "Scraping"}
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  PlayStation Profile
                  {result.realData && (
                    <Badge variant="default" className="bg-green-500">
                      Real Data
                    </Badge>
                  )}
                  {result.scrapedData && (
                    <Badge variant="secondary">Scraped Data</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={result.player.avatar}
                    alt={result.player.displayName}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{result.player.displayName}</h3>
                    <p className="text-muted-foreground">ID: {result.player.id}</p>
                    <p className="text-sm text-muted-foreground">{result.player.lastOnline}</p>
                  </div>
                </div>

                {result.trophies && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Trophy Statistics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Level {result.trophies.level}</p>
                        <p className="text-muted-foreground">{result.trophies.category}</p>
                      </div>
                      <div>
                        <p className="font-medium">{result.trophies.totalTrophies} Total</p>
                        <p className="text-muted-foreground">{result.trophies.progress}% Progress</p>
                      </div>
                      <div>
                        <p className="font-medium">🥇 {result.trophies.platinum}</p>
                        <p className="text-muted-foreground">Platinum</p>
                      </div>
                      <div>
                        <p className="font-medium">🥇 {result.trophies.gold}</p>
                        <p className="text-muted-foreground">Gold</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Gaming Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{result.totalGames}</div>
                    <div className="text-sm text-muted-foreground">Total Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{formatHours(result.totalHours)}</div>
                    <div className="text-sm text-muted-foreground">Total Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{result.avgHoursPerGame.toFixed(1)}h</div>
                    <div className="text-sm text-muted-foreground">Avg per Game</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Games</CardTitle>
                <CardDescription>Most played games based on hours/trophies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.topGames.map((game, index) => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{game.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Last played: {new Date(game.lastPlayed).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatHours(game.hoursPlayed)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={result.qualificationStatus === "qualified" ? "default" : "secondary"}
                  >
                    {result.qualificationStatus}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.qualificationReason}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How to Get Your NPSSO Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your browser and go to <strong>https://my.playstation.com</strong></li>
              <li>Log in with your PlayStation account</li>
              <li>Open Developer Tools (F12 or right-click → Inspect)</li>
              <li>Go to <strong>Application</strong> tab → <strong>Cookies</strong> → <strong>https://my.playstation.com</strong></li>
              <li>Find the cookie named <strong>"npsso"</strong></li>
              <li>Copy the 64-character value and paste it above</li>
            </ol>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-800 text-xs">
                <strong>Note:</strong> NPSSO tokens expire after ~2 months. If the API fails, get a fresh token.
                This method accesses your real PlayStation data including trophies, games, and playtime.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}