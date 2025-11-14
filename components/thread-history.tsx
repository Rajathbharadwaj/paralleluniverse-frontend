"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle2, XCircle, RefreshCw, Eye } from 'lucide-react';

interface Thread {
  thread_id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
}

export function ThreadHistory() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  useEffect(() => {
    loadThreadHistory();
  }, []);

  const loadThreadHistory = async () => {
    setLoading(true);
    try {
      // For now, load from localStorage (could be API endpoint later)
      const stored = localStorage.getItem('workflow_thread_history');
      if (stored) {
        setThreads(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load thread history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Thread History</CardTitle>
        <Button onClick={loadThreadHistory} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {threads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No workflow executions yet
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {threads.map((thread) => (
                <div
                  key={thread.thread_id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedThread === thread.thread_id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedThread(thread.thread_id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(thread.status)} text-white text-xs`}
                        >
                          {getStatusIcon(thread.status)}
                          <span className="ml-1">{thread.status}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(thread.started_at)}
                        </span>
                      </div>

                      <h4 className="font-medium text-sm truncate">
                        {thread.workflow_name}
                      </h4>

                      <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                        {thread.thread_id}
                      </p>
                    </div>

                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      // View thread details
                      console.log('View thread:', thread.thread_id);
                    }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
