import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, UserPlus, UserMinus, Users, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface XboxPlayer {
  xuid: string;
  gamertag: string;
  displayName: string;
  gamerscore: number;
  avatar: string;
  isOnline?: boolean;
  currentActivity?: string;
  lastSeen?: string;
  isFavorite?: boolean;
  isFollowingCaller?: boolean;
  isFollowedByCaller?: boolean;
}

export default function XboxFriends() {
  const [friends, setFriends] = useState<XboxPlayer[]>([]);
  const [searchResults, setSearchResults] = useState<XboxPlayer[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<XboxPlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState({
    friends: false,
    search: false,
    recent: false,
    action: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFriends();
    loadRecentPlayers();
  }, []);

  const loadFriends = async () => {
    setLoading(prev => ({ ...prev, friends: true }));
    try {
      const response = await fetch('/api/xbox/friends');
      const data = await response.json();
      
      if (data.success) {
        setFriends(data.friends);
      } else {
        toast({
          title: "Error",
          description: "Failed to load friends list",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to connect to Xbox Live",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, friends: false }));
    }
  };

  const loadRecentPlayers = async () => {
    setLoading(prev => ({ ...prev, recent: true }));
    try {
      const response = await fetch('/api/xbox/recent-players');
      const data = await response.json();
      
      if (data.success) {
        setRecentPlayers(data.recentPlayers);
      }
    } catch (error) {
      console.error('Failed to load recent players:', error);
    } finally {
      setLoading(prev => ({ ...prev, recent: false }));
    }
  };

  const searchPlayers = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(prev => ({ ...prev, search: true }));
    try {
      const response = await fetch('/api/xbox/search-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamertag: searchTerm.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.players);
        if (data.players.length === 0) {
          toast({
            title: "No Results",
            description: `No Xbox players found for "${searchTerm}"`
          });
        }
      } else {
        toast({
          title: "Search Failed",
          description: data.error || "Failed to search for players",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search Xbox Live",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const addFriend = async (player: XboxPlayer) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await fetch('/api/xbox/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xuid: player.xuid })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Friend Added",
          description: `Added ${player.gamertag} to your friends list`
        });
        loadFriends(); // Refresh friends list
      } else {
        toast({
          title: "Failed to Add Friend",
          description: data.error || "Something went wrong",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add friend",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const removeFriend = async (player: XboxPlayer) => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await fetch('/api/xbox/remove-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xuid: player.xuid })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Friend Removed",
          description: `Removed ${player.gamertag} from your friends list`
        });
        loadFriends(); // Refresh friends list
      } else {
        toast({
          title: "Failed to Remove Friend",
          description: data.error || "Something went wrong",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const PlayerCard = ({ player, showAddButton = false, showRemoveButton = false }: { 
    player: XboxPlayer; 
    showAddButton?: boolean;
    showRemoveButton?: boolean;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={player.avatar} alt={player.gamertag} />
            <AvatarFallback>{player.gamertag.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{player.gamertag}</h3>
              {player.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            </div>
            <p className="text-sm text-muted-foreground">{player.gamerscore?.toLocaleString()} G</p>
            {player.isOnline && (
              <Badge variant="secondary" className="text-xs mt-1">
                {player.currentActivity || "Online"}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {showAddButton && (
              <Button
                size="sm"
                onClick={() => addFriend(player)}
                disabled={loading.action}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            {showRemoveButton && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeFriend(player)}
                disabled={loading.action}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Xbox Friends Manager</h1>
        <p className="text-muted-foreground">
          Manage your Xbox Live friends, discover new players, and see who you've played with recently.
        </p>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Players
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Players
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Your Xbox Friends
                <Button onClick={loadFriends} disabled={loading.friends} size="sm">
                  {loading.friends ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.friends ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : friends.length > 0 ? (
                <div className="grid gap-3">
                  {friends.map((friend) => (
                    <PlayerCard 
                      key={friend.xuid} 
                      player={friend} 
                      showRemoveButton={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No friends found. Use the search tab to find and add friends!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Xbox Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter gamertag to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPlayers()}
                />
                <Button onClick={searchPlayers} disabled={loading.search || !searchTerm.trim()}>
                  {loading.search ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="grid gap-3">
                  {searchResults.map((player) => (
                    <PlayerCard 
                      key={player.xuid} 
                      player={player} 
                      showAddButton={!player.isFollowedByCaller}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Players
                <Button onClick={loadRecentPlayers} disabled={loading.recent} size="sm">
                  {loading.recent ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.recent ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : recentPlayers.length > 0 ? (
                <div className="grid gap-3">
                  {recentPlayers.map((player) => (
                    <PlayerCard 
                      key={player.xuid} 
                      player={player} 
                      showAddButton={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent players found. Play some games to see who you've played with!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}