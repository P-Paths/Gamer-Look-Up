import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Activity, Users, Clock } from "lucide-react";
import { format } from "date-fns";

interface XboxActivity {
  id: string;
  type: 'game' | 'achievement' | 'social' | 'other';
  title: string;
  description?: string;
  gameName?: string;
  timestamp: string;
  achievement?: {
    name: string;
    description: string;
    gamerscore: number;
    rarity: string;
  };
}

interface XboxPresence {
  xuid: string;
  state: 'Online' | 'Away' | 'Offline';
  lastSeen?: string;
  currentActivity?: {
    type: 'Game' | 'App' | 'Home';
    name: string;
    details?: string;
  };
  devices?: string[];
}

interface ActivityHistory {
  activities: XboxActivity[];
  totalItems: number;
  hasMore: boolean;
}

export default function XboxActivity() {
  const [activityHistory, setActivityHistory] = useState<ActivityHistory | null>(null);
  const [activityFeed, setActivityFeed] = useState<XboxActivity[]>([]);
  const [presence, setPresence] = useState<XboxPresence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const xuid = "2535454283693482"; // Wonder Bread326's XUID

  const fetchActivityData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all activity data simultaneously
      const [historyRes, feedRes, presenceRes] = await Promise.all([
        fetch('/api/xbox/activity/history'),
        fetch('/api/xbox/activity/feed'),
        fetch(`/api/xbox/presence/${xuid}`)
      ]);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setActivityHistory(historyData);
      }

      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setActivityFeed(feedData.activities || []);
      }

      if (presenceRes.ok) {
        const presenceData = await presenceRes.json();
        setPresence(presenceData);
      }

    } catch (err) {
      setError('Failed to fetch Xbox activity data');
      console.error('Xbox activity fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'game': return '🎮';
      case 'achievement': return '🏆';
      case 'social': return '👥';
      default: return '📱';
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'Online': return 'bg-green-500';
      case 'Away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Xbox Activity Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time activity tracking for Wonder Bread326
          </p>
        </div>
        <Button 
          onClick={fetchActivityData} 
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Presence Status */}
      {presence && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(presence.state)}`} />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={presence.state === 'Online' ? 'default' : 'secondary'}>
                  {presence.state}
                </Badge>
              </div>
              
              {presence.currentActivity && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Playing:</span>
                  <span className="text-sm">{presence.currentActivity.name}</span>
                </div>
              )}
              
              {presence.lastSeen && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Last Seen:</span>
                  <span className="text-sm">
                    {format(new Date(presence.lastSeen), 'PPpp')}
                  </span>
                </div>
              )}

              {presence.devices && presence.devices.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Devices:</span>
                  <span className="text-sm">{presence.devices.join(', ')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="feed" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity Feed ({activityFeed.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            History ({activityHistory?.totalItems || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Xbox Live Activity Feed</CardTitle>
              <CardDescription>
                Recent Xbox Live activities from your network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityFeed.length > 0 ? (
                <div className="space-y-4">
                  {activityFeed.slice(0, 10).map((activity, index) => (
                    <div key={activity.id || index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium truncate">{activity.title}</h4>
                            <Badge variant="outline">{activity.type}</Badge>
                          </div>
                          
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {activity.description}
                            </p>
                          )}
                          
                          {activity.gameName && (
                            <p className="text-sm font-medium text-blue-600 mb-2">
                              🎮 {activity.gameName}
                            </p>
                          )}
                          
                          {activity.achievement && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-yellow-800">
                                  🏆 {activity.achievement.name}
                                </span>
                                <span className="text-sm font-bold text-yellow-700">
                                  {activity.achievement.gamerscore}G
                                </span>
                              </div>
                              <p className="text-sm text-yellow-700 mt-1">
                                {activity.achievement.description}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {activity.achievement.rarity}
                              </Badge>
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.timestamp), 'PPpp')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No recent activity data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>
                Your personal Xbox Live activity history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityHistory && activityHistory.activities.length > 0 ? (
                <div className="space-y-4">
                  {activityHistory.activities.map((activity, index) => (
                    <div key={activity.id || index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(activity.timestamp), 'PPpp')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Activity History</h3>
                  <p className="text-sm text-muted-foreground">
                    Your Xbox Live activity history will appear here once you start gaming
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary">$5 OpenXBL Plan</Badge>
            <span className="text-sm text-blue-700">Features Available</span>
          </div>
          <div className="text-sm text-blue-600">
            ✅ Real-time presence tracking • ✅ Activity feed (50+ items) • ✅ Social activity monitoring
          </div>
        </CardContent>
      </Card>
    </div>
  );
}