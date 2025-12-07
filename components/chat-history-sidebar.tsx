'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchBackend } from '@/lib/api-client';

interface Thread {
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
}

interface ChatHistorySidebarProps {
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
}

export function ChatHistorySidebar({ currentThreadId, onThreadSelect, onNewChat }: ChatHistorySidebarProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id || '';
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load threads on mount
  useEffect(() => {
    if (!userId) return;
    console.log('🔄 Loading threads for user:', userId);
    loadThreads();
  }, [userId]);

  const loadThreads = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      console.log('📡 Fetching threads for user:', userId);

      const token = await getToken();
      if (!token) return;

      const response = await fetchBackend(`/api/agent/threads/list/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('📦 Received data:', data);
      
      if (data.success) {
        setThreads(data.threads);
        console.log(`✅ Loaded ${data.count} threads:`, data.threads);
      } else {
        console.error('❌ Failed to load threads:', data);
      }
    } catch (error) {
      console.error('❌ Error loading threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full border-r bg-card/30 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Chat History</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onNewChat();
              // Reload threads after a short delay to show new chat
              setTimeout(loadThreads, 500);
            }}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.thread_id}
                onClick={() => onThreadSelect(thread.thread_id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  "hover:bg-accent",
                  currentThreadId === thread.thread_id && "bg-accent border border-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm line-clamp-1">
                    {thread.title}
                  </h4>
                  <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                </div>
                
                {thread.last_message && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {thread.last_message}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground">
                  {formatDate(thread.updated_at || thread.created_at)}
                </p>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

