import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PSNDashboard } from "@/components/PSNDashboard";
import { ArrowLeft, Search } from "lucide-react";
import { SiPlaystation } from "react-icons/si";

const psnLookupSchema = z.object({
  gamerTag: z.string().min(1, "Gamer tag is required"),
});

type PSNLookupForm = z.infer<typeof psnLookupSchema>;

export default function PSNDashboardPage() {
  const [, setLocation] = useLocation();
  const [searchedGamerTag, setSearchedGamerTag] = useState<string>("");

  const form = useForm<PSNLookupForm>({
    resolver: zodResolver(psnLookupSchema),
    defaultValues: {
      gamerTag: "",
    },
  });

  // Initialize gamer tag from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    if (tag) {
      const decodedTag = decodeURIComponent(tag);
      form.setValue('gamerTag', decodedTag);
      setSearchedGamerTag(decodedTag);
    }
  }, [form]);

  const onSubmit = (data: PSNLookupForm) => {
    setSearchedGamerTag(data.gamerTag);
    
    // Update URL without navigation
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tag', encodeURIComponent(data.gamerTag));
    window.history.replaceState({}, '', newUrl.toString());
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="flex items-center space-x-3">
              <SiPlaystation className="text-blue-500 text-xl" />
              <h1 className="text-xl font-semibold text-white">PlayStation Dashboard</h1>
            </div>
            
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Search Section */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-500" />
              <span>PlayStation Profile Lookup</span>
            </CardTitle>
            <CardDescription>
              Enter a PlayStation gamer tag to view detailed gaming statistics and trophy data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="gamerTag" className="text-sm font-medium text-gray-300">
                  Gamer Tag
                </Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="gamerTag"
                    {...form.register('gamerTag')}
                    placeholder="Enter PlayStation gamer tag..."
                    className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={form.formState.isSubmitting}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
                {form.formState.errors.gamerTag && (
                  <p className="text-red-400 text-sm mt-1">
                    {form.formState.errors.gamerTag.message}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {searchedGamerTag && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white mb-1">
                Gaming Profile: {searchedGamerTag}
              </h2>
              <p className="text-gray-400 text-sm">
                Real-time PlayStation Network data and statistics
              </p>
            </div>
            
            <PSNDashboard gamerTag={searchedGamerTag} />
          </div>
        )}

        {/* Instructions */}
        {!searchedGamerTag && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                <p>Enter any PlayStation gamer tag in the search box above</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                <p>If this is your first time, you'll be prompted to connect your PSN account</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                <p>View real PlayStation data including games, trophies, and playtime statistics</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}