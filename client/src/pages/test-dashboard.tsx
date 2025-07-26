import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameData {
  id: string;
  name: string;
  hoursPlayed: number;
  platform: string;
  lastPlayed: string;
}

interface PlayerData {
  id: string;
  gamerTag: string;
  displayName: string;
  avatar: string;
  lastOnline: string;
  gamerscore?: number;
}

interface TestResult {
  platform: string;
  player?: PlayerData;
  totalHours: number;
  totalGames: number;
  qualificationStatus: string;
  qualificationReason: string;
  topGames?: GameData[];
  error?: string;
}

export default function TestDashboard() {
  const [gamerTag, setGamerTag] = useState('');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const presetProfiles = [
    { platform: 'xbox', gamerTag: 'Wonder Bread326', description: 'Your Xbox Profile (Production Ready)' },
    { platform: 'playstation', gamerTag: 'LAZARUS_729', description: 'Your PlayStation Profile (Needs Token)' },
    { platform: 'steam', gamerTag: 'gaben', description: 'Sample Steam Profile (May be Private)' }
  ];

  const testPlatform = async () => {
    if (!platform || !gamerTag) {
      alert('Please select a platform and enter a gamer tag');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/platform/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamerTag, platform })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setResult({ ...data, platform, error: data.error });
      }
    } catch (error) {
      setResult({
        platform,
        error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        totalHours: 0,
        totalGames: 0,
        qualificationStatus: 'error',
        qualificationReason: 'Request failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: typeof presetProfiles[0]) => {
    setPlatform(preset.platform);
    setGamerTag(preset.gamerTag);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Multi-Platform Gaming Integration Test
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Test your Xbox, PlayStation, and Steam profile integrations with authentic data
            </p>
          </CardHeader>
        </Card>

        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Platform Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a gaming platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xbox">Xbox (OpenXBL Premium)</SelectItem>
                  <SelectItem value="playstation">PlayStation (PSN API)</SelectItem>
                  <SelectItem value="steam">Steam (Web API)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gamer Tag Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Gamer Tag</label>
              <Input
                value={gamerTag}
                onChange={(e) => setGamerTag(e.target.value)}
                placeholder="Enter gamer tag or username"
              />
            </div>

            {/* Preset Profiles */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Test Profiles</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {presetProfiles.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => loadPreset(preset)}
                    className="text-xs p-2 h-auto flex flex-col items-start"
                  >
                    <span className="font-medium">{preset.platform.toUpperCase()}</span>
                    <span className="text-muted-foreground">{preset.gamerTag}</span>
                    <span className="text-xs text-muted-foreground">{preset.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Test Button */}
            <Button 
              onClick={testPlatform} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Platform Integration'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Test Results</CardTitle>
                <Badge variant={result.error ? 'destructive' : 'default'}>
                  {result.error ? 'FAILED' : 'SUCCESS'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">Error</h3>
                  <p className="text-red-700 text-sm">{result.error}</p>
                  
                  {/* Error-specific guidance */}
                  {result.error.includes('private') && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-blue-800 text-sm font-medium">How to fix:</p>
                      <p className="text-blue-700 text-xs">Set your Steam profile to public in Privacy Settings</p>
                    </div>
                  )}
                  
                  {result.error.includes('NPSSO') && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-blue-800 text-sm font-medium">How to fix:</p>
                      <p className="text-blue-700 text-xs">Refresh your PlayStation NPSSO token</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Player Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Player</p>
                      <p className="font-medium">{result.player?.gamerTag || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="font-medium">{result.totalHours}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Games</p>
                      <p className="font-medium">{result.totalGames}</p>
                    </div>
                    {result.player?.gamerscore && (
                      <div>
                        <p className="text-sm text-muted-foreground">Gamerscore</p>
                        <p className="font-medium">{result.player.gamerscore}</p>
                      </div>
                    )}
                  </div>

                  {/* Data Quality */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-green-800">Data Quality</h3>
                      <Badge variant={result.qualificationStatus === 'qualified' ? 'default' : 'secondary'}>
                        {result.qualificationStatus}
                      </Badge>
                    </div>
                    <p className="text-green-700 text-sm">{result.qualificationReason}</p>
                  </div>

                  {/* Top Games */}
                  {result.topGames && result.topGames.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Top Games</h3>
                      <div className="space-y-2">
                        {result.topGames.slice(0, 5).map((game, index) => (
                          <div key={game.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="font-medium">{game.name}</span>
                            <span className="text-muted-foreground">{game.hoursPlayed}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>API Integration Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Primary Endpoint</h4>
              <code className="text-sm">POST /api/platform/lookup</code>
              
              <h4 className="font-medium mt-4 mb-2">Request Body</h4>
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">
{`{
  "gamerTag": "Wonder Bread326",
  "platform": "xbox"
}`}
              </pre>
              
              <h4 className="font-medium mt-4 mb-2">Response</h4>
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">
{`{
  "platform": "xbox",
  "player": {
    "gamerTag": "Wonder Bread326",
    "gamerscore": 12345
  },
  "totalHours": 0,
  "totalGames": 10,
  "qualificationStatus": "not_qualified",
  "qualificationReason": "Premium Xbox data",
  "topGames": [...]
}`}
              </pre>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Production Ready:</strong> Xbox integration with authentic achievement data</p>
              <p><strong>In Development:</strong> PlayStation (needs NPSSO token) and Steam (needs public profile)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}