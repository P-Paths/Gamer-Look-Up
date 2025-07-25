import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PSNTokenExpired } from "./PSNTokenExpired";
import { 
  Trophy, 
  Clock, 
  Gamepad2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  User,
  Calendar
} from "lucide-react";
import { SiPlaystation } from "react-icons/si";

interface PSNData {
  success: boolean;
  player: {
    displayName: string;
    avatarUrl?: string;
    onlineId: string;
    country?: string;
    language?: string;
  };
  trophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    level: number;
    progress: number;
  };
  games: Array<{
    name: string;
    platform: string;
    hoursPlayed: number;
    lastPlayed?: string;
    imageUrl?: string;
    trophiesEarned?: number;
    totalTrophies?: number;
  }>;
  totalHours: number;
  totalGames: number;
  recentActivity?: Array<{
    type: string;
    game: string;
    timestamp: string;
    description: string;
  }>;
}

interface TokenStatus {
  exists: boolean;
  isExpired: boolean;
  lastUpdated?: string;
}

export function PSNDashboard({ gamerTag }: { gamerTag: string }) {
  const [showTokenExpired, setShowTokenExpired] = useState(false);
  const { toast } = useToast();

  // Check token status
  const { data: tokenStatus, refetch: refetchStatus } = useQuery<{
    success: boolean;
    tokenStatus: TokenStatus;
  }>({
    queryKey: ['/api/psn/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Fetch PSN data
  const { data: psnData, isLoading, error, refetch } = useQuery<PSNData>({
    queryKey: ['/api/platform/lookup', gamerTag],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/platform/lookup", {
        gamerTag,
        platform: 'playstation'
      });
      return response.json();
    },
    enabled: !!gamerTag && tokenStatus?.tokenStatus.exists && !tokenStatus.tokenStatus.isExpired,
    retry: false,
  });

  // Token refresh mutation
  const refreshTokenMutation = useMutation({
    mutationFn: async (newToken: string) => {
      const response = await apiRequest("POST", "/api/platform/psn-refresh-token", {
        npsso: newToken
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "PSN Reconnected!",
        description: "Your PlayStation data connection has been restored",
      });
      refetchStatus();
      refetch();
      setShowTokenExpired(false);
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Please check your token and try again",
        variant: "destructive",
      });
    },
  });

  // Show token expired modal if needed
  useEffect(() => {
    if (tokenStatus?.tokenStatus.isExpired || error?.message?.includes("Invalid NPSSO")) {
      setShowTokenExpired(true);
    }
  }, [tokenStatus, error]);

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-300">Loading PlayStation data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!tokenStatus?.tokenStatus.exists) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-8 text-center">
          <SiPlaystation className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2 text-white">PSN Connection Required</h3>
          <p className="text-gray-400 mb-4">Connect your PlayStation account to view gaming data</p>
          <Button 
            onClick={() => setShowTokenExpired(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <SiPlaystation className="w-4 h-4 mr-2" />
            Connect PlayStation
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error || !psnData?.success) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-8">
          <Alert className="bg-red-900/20 border-red-600/30 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              Failed to load PlayStation data. This usually means your token has expired.
            </AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button 
              onClick={() => setShowTokenExpired(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh PSN Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Profile Card */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={psnData.player.avatarUrl} alt={psnData.player.displayName} />
              <AvatarFallback className="bg-blue-600 text-white">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl text-white flex items-center space-x-2">
                <SiPlaystation className="text-blue-500" />
                <span>{psnData.player.displayName}</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                {psnData.player.onlineId} • PlayStation Network
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Trophy Stats Card */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Trophy className="text-yellow-500 h-5 w-5" />
            <span>Trophy Collection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">{psnData.trophies.platinum}</p>
              <p className="text-sm text-gray-400">Platinum</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{psnData.trophies.gold}</p>
              <p className="text-sm text-gray-400">Gold</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{psnData.trophies.silver}</p>
              <p className="text-sm text-gray-400">Silver</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{psnData.trophies.bronze}</p>
              <p className="text-sm text-gray-400">Bronze</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-blue-600 text-blue-400">
              Level {psnData.trophies.level}
            </Badge>
            <span className="text-sm text-gray-400">
              {psnData.trophies.progress}% to next level
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Gaming Stats Card */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Gamepad2 className="text-blue-500 h-5 w-5" />
            <span>Gaming Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{psnData.totalHours}</p>
              <p className="text-sm text-gray-400">Total Hours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{psnData.totalGames}</p>
              <p className="text-sm text-gray-400">Games Played</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Games */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Clock className="text-green-500 h-5 w-5" />
            <span>Recent Games</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {psnData.games.slice(0, 5).map((game, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-white">{game.name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{game.hoursPlayed}h played</span>
                    {game.lastPlayed && (
                      <>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{game.lastPlayed}</span>
                      </>
                    )}
                  </div>
                </div>
                {game.trophiesEarned && game.totalTrophies && (
                  <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                    <Trophy className="h-3 w-3 mr-1" />
                    {game.trophiesEarned}/{game.totalTrophies}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-300">PSN Connected</span>
              {tokenStatus?.tokenStatus.lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated {new Date(tokenStatus.tokenStatus.lastUpdated).toLocaleDateString()}
                </span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTokenExpired(true)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PSN Token Expired Modal */}
      <PSNTokenExpired
        isOpen={showTokenExpired}
        onTokenRefresh={(token) => refreshTokenMutation.mutate(token)}
        onClose={() => setShowTokenExpired(false)}
      />
    </div>
  );
}