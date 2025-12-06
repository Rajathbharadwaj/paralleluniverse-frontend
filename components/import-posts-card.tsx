'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Download, RefreshCw, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { useWebSocket } from '@/contexts/websocket-context';
import { fetchExtension, fetchBackend } from '@/lib/api-client';

interface ScrapedPost {
  content: string;
  timestamp: string;
  engagement: {
    likes: number;
    replies: number;
    reposts: number;
    views: number;
  };
  postUrl: string;
}

interface WritingStyle {
  tone: string;
  avg_post_length: number;
  avg_comment_length: number;
  uses_emojis: boolean;
  uses_questions: boolean;
  technical_terms: string[];
}

interface ImportResult {
  success: boolean;
  imported_count: number;
  total_scraped: number;
  writing_style: WritingStyle;
  message: string;
}

interface ImportPostsCardProps {
  onImportComplete?: (count: number) => void;
}

export function ImportPostsCard({ onImportComplete }: ImportPostsCardProps = {}) {
  const { user } = useUser();
  const userId = user?.id || '';
  
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);
  const [targetCount, setTargetCount] = useState(50);
  const [scrapedPosts, setScrapedPosts] = useState<ScrapedPost[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // SECURITY: Send Clerk user ID to extension on component mount
  // This ensures extension uses Clerk ID instead of generating random ID
  useEffect(() => {
    const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;
    if (!userId || !extensionId || extensionId === 'your-extension-id') {
      return;
    }

    try {
      (window as any).chrome?.runtime?.sendMessage(
        extensionId,
        {
          type: 'CONNECT_WITH_USER_ID',
          userId: userId
        },
        () => {
          if ((window as any).chrome?.runtime?.lastError) {
            console.log('Extension not installed:', (window as any).chrome.runtime.lastError);
          } else {
            console.log('Configured extension with Clerk user ID:', userId);
          }
        }
      );
    } catch (error) {
      console.log('Extension communication not available');
    }
  }, [userId]);

  // Fetch actual count from database on mount
  useEffect(() => {
    const fetchPostsCount = async () => {
      if (!userId) return;
      
      try {
        // Get connected user's username - pass user_id to only get THIS user's data (security fix)
        const statusResponse = await fetchExtension(`/status?user_id=${userId}`);
        const statusData = await statusResponse.json();
        // Accept both 'users' and 'users_with_info' field names for compatibility
        const usersList = statusData.users_with_info || statusData.users || [];
        const connectedUser = usersList.find((u: any) => u.hasCookies && u.username && u.userId === userId);

        if (connectedUser && connectedUser.username) {
          // Fetch count from database
          const countResponse = await fetchBackend(`/api/posts/count/${connectedUser.username}`);
          const countData = await countResponse.json();
          
          if (countData.success && countData.count > 0) {
            console.log(`📊 Loaded ${countData.count} posts from database for @${connectedUser.username}`);
            setImportResult({
              success: true,
              imported_count: countData.count,
              total_scraped: countData.count,
              writing_style: {} as WritingStyle,
              message: `Found ${countData.count} existing posts for @${connectedUser.username}`
            });
            
            // DON'T call onImportComplete on initial load - only on actual imports
            // This prevents resetting manuallyOpened when user clicks "Sync"
          }
        }
      } catch (error) {
        console.error('Failed to fetch posts count from database:', error);
      }
    };
    
    fetchPostsCount();
    
    // Also load cached data as fallback
    const cachedResult = localStorage.getItem(`import_result_${userId}`);
    const cachedDate = localStorage.getItem(`last_import_date_${userId}`);
    
    if (cachedResult && !importResult) {
      try {
        const parsed = JSON.parse(cachedResult);
        setImportResult(parsed);
      } catch (error) {
        console.error('Failed to parse cached import result:', error);
      }
    }
    
    if (cachedDate) {
      setLastImportDate(cachedDate);
    }
  }, [userId]);
  const [error, setError] = useState<string | null>(null);
  const { ws, subscribe } = useWebSocket(); // Use shared WebSocket
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);

  // Subscribe to shared WebSocket for import/scraping messages
  useEffect(() => {
    if (!userId) {
      console.log('⚠️ No user ID, skipping WebSocket subscription');
      return;
    }

    console.log('📡 Subscribing to import messages...');
    
    const unsubscribe = subscribe((data) => {
      // Ignore agent-related messages (handled by agent-control-card)
      if (data.type?.startsWith('AGENT_')) {
        return;
      }
      
      console.log('📨 Import card received:', data);

      if (data.type === 'SCRAPE_PROGRESS') {
        // Real-time progress updates
        setCurrentCount(data.current);
        setTargetCount(data.target);
        setProgress((data.current / data.target) * 100);
        console.log(`📊 Progress: ${data.current}/${data.target} posts (scroll ${data.scroll})`);
      } else if (data.type === 'SCRAPING_PROGRESS') {
        setCurrentCount(data.current);
        setTargetCount(data.target);
        setProgress((data.current / data.target) * 100);
      } else if (data.type === 'POSTS_SCRAPED') {
        setScrapedPosts(data.posts || []);
      } else if (data.type === 'IMPORT_COMPLETE') {
        console.log('✅ Import complete:', data);
        setImportResult({
          success: true,
          imported_count: data.imported || 0,
          total_scraped: data.total || 0,
          writing_style: {} as WritingStyle,
          message: `Successfully imported ${data.imported || 0} posts`
        });
        setIsImporting(false);
        setLastImportDate(new Date().toISOString());
        setProgress(100);

        // Save to localStorage
        localStorage.setItem(`import_result_${userId}`, JSON.stringify({
          success: true,
          imported_count: data.imported || 0,
          total_scraped: data.total || 0,
          writing_style: {} as WritingStyle,
          message: `Successfully imported ${data.imported || 0} posts`
        }));
        localStorage.setItem(`last_import_date_${userId}`, new Date().toISOString());
        
        // Notify parent component
        if (onImportComplete) {
          onImportComplete(data.total);
        }
      } else if (data.type === 'SCRAPE_ERROR') {
        setError(data.error || 'Failed to scrape posts');
        setIsImporting(false);
      } else if (data.type === 'ERROR') {
        setError(data.message);
        setIsImporting(false);
      }
    });

    return unsubscribe;
  }, [userId, subscribe]);

  const handleImportPosts = async (isSync: boolean = false) => {
    console.log('🚀 handleImportPosts called, isSync:', isSync);
    console.log('   userId:', userId);
    console.log('   isImporting:', isImporting);
    
    setIsImporting(true);
    setError(null);
    setProgress(0);
    setCurrentCount(0);
    setScrapedPosts([]);
    setImportResult(null);

    try {
      // First, get the actual user_id from extension backend - MUST pass user_id for security!
      console.log('🔍 Fetching connected user ID...');
      const statusResponse = await fetchBackend(`/api/extension/status?user_id=${userId}`);
      const statusData = await statusResponse.json();

      let extensionUserId = 'default_user';
      // Accept both 'users' and 'users_with_info' field names for compatibility
      const usersList = statusData.users_with_info || statusData.users || [];
      // SECURITY: Filter to only THIS user's data
      const connectedUser = usersList.find((u: any) => u.userId === userId);
      if (connectedUser) {
        extensionUserId = connectedUser.userId;
        console.log(`✅ Found extension user: ${extensionUserId}`);
      } else {
        console.warn('⚠️ No connected users, using default_user');
      }

      // Use Docker browser to scrape posts (not user's browser!)
      console.log('📤 Requesting Docker browser to scrape posts...');
      console.log(`   Extension User ID: ${extensionUserId}`);
      console.log(`   Clerk User ID (for WebSocket): ${userId}`);

      // Create AbortController with longer timeout for scraping
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      try {
        const response = await fetchBackend('/api/scrape-posts-docker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: extensionUserId,  // Extension user ID for scraping
            clerk_user_id: userId,      // Clerk user ID for WebSocket messages
            targetCount: isSync ? 20 : 50
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Import complete:', result);
          const importData: ImportResult = {
            success: true,
            imported_count: result.imported || 0,
            total_scraped: result.total || 0,
            writing_style: result.writing_style || ({} as WritingStyle),
            message: result.message || `Successfully imported ${result.imported || 0} posts`
          };
          setImportResult(importData);
          setProgress(100);
          setLastImportDate(new Date().toISOString());

          // Save to localStorage
          if (userId) {
            localStorage.setItem(`import_result_${userId}`, JSON.stringify(importData));
            localStorage.setItem(`last_import_date_${userId}`, new Date().toISOString());
          }
        } else {
          setError(result.error || 'Failed to import posts');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          setError('Import timed out. Please try again with "Sync Latest" for fewer posts.');
        } else {
          throw fetchError;
        }
      }
      
      setIsImporting(false);
      
    } catch (err) {
      console.error('❌ Import failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to start import');
      setIsImporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getTotalEngagement = (post: ScrapedPost) => {
    return post.engagement.likes + post.engagement.replies + post.engagement.reposts;
  };

  const hasImported = importResult && importResult.imported_count > 0;

  return (
    <Card className={`w-full transition-all duration-500 ${
      hasImported ? 'h-auto' : 'animate-in fade-in slide-in-from-top duration-700'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`flex items-center gap-2 transition-all duration-300 ${
              hasImported ? 'text-base' : 'text-xl'
            }`}>
              <Download className={`h-5 w-5 ${hasImported ? 'text-green-500' : ''}`} />
              {hasImported ? '✅ Posts Imported' : 'Import Your Posts'}
            </CardTitle>
            {!hasImported && (
              <CardDescription className="animate-in fade-in duration-500 delay-100">
                Learn your writing style from your past X posts
              </CardDescription>
            )}
          </div>
          {lastImportDate && !hasImported && (
            <Badge variant="outline" className="text-xs">
              Last import: {formatDate(lastImportDate)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasImported && (
          <div className="animate-in fade-in zoom-in duration-500 mb-4">
            <p className="text-sm text-muted-foreground">
              Successfully imported <span className="font-semibold text-foreground">{importResult.imported_count} posts</span>!
              Your agent can now write in your style.
            </p>
          </div>
        )}
        
        {/* Action Buttons - Always show so user can import more */}
        <div className="flex gap-2 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
              <Button
                onClick={() => handleImportPosts(false)}
                disabled={isImporting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import Posts (50)
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleImportPosts(true)}
                disabled={isImporting}
                variant="outline"
                size="lg"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Latest
                  </>
                )}
              </Button>
            </div>

        {/* Progress */}
        {isImporting && (
          <div className="space-y-3 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-medium text-sm">Scraping posts from VNC browser...</span>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {currentCount} / {targetCount}
              </span>
            </div>
            <Progress value={progress} className="w-full h-2" />
            <div className="text-xs text-muted-foreground">
              {progress < 100 ? (
                <>Scrolling through your profile to load more posts...</>
              ) : (
                <>Finalizing import...</>
              )}
            </div>
          </div>
        )}

        {/* Error with Retry */}
        {error && (
          <div className="space-y-2 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Something went wrong</span>
            </div>
            <p className="text-xs text-destructive/80">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                handleImportPosts(false);
              }}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Try Again
            </Button>
          </div>
        )}

        {/* Import Result */}
        {importResult && !isImporting && (
          <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-300">
                ✨ Posts imported successfully!
              </span>
            </div>

            {/* Writing Style Analysis */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg space-y-3 border">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <h4 className="font-semibold">Your Writing Style</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Imported:</span>
                  <span className="ml-2 font-medium">
                    {importResult.imported_count} posts
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium">
                    {importResult.total_scraped} posts
                  </span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                ✅ Posts imported successfully! The agent can now learn your writing style.
              </div>
            </div>
          </div>
        )}

        {/* Scraped Posts Preview */}
        {scrapedPosts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">
              Scraped Posts ({scrapedPosts.length})
            </h4>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {scrapedPosts.slice(0, 10).map((post, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-sm line-clamp-3">{post.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(post.timestamp)}</span>
                      <div className="flex gap-3">
                        <span>❤️ {post.engagement.likes}</span>
                        <span>💬 {post.engagement.replies}</span>
                        <span>🔄 {post.engagement.reposts}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {scrapedPosts.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {scrapedPosts.length - 10} more posts
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Instructions */}
        {!isImporting && !importResult && !error && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="text-sm font-semibold">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click "Import Posts" to scrape your last 50 posts</li>
              <li>We'll analyze your writing style (tone, length, vocabulary)</li>
              <li>The agent will learn to write comments like you</li>
              <li>Use "Sync Latest" to update with recent posts</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

