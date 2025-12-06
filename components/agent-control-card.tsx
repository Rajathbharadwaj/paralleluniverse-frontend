'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, Square, Sparkles, MessageSquare, Plus, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatHistorySidebar } from './chat-history-sidebar';
import { useWebSocket } from '@/contexts/websocket-context';
import { ResizableSidebar } from './resizable-sidebar';
import { fetchBackendAuth } from '@/lib/api-client';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AgentStatus {
  isRunning: boolean;
  currentTask: string | null;
  threadId: string | null;
}

export function AgentControlCard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id || '';
  const { ws, subscribe } = useWebSocket(); // Use shared WebSocket
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AgentStatus>({
    isRunning: false,
    currentTask: null,
    threadId: null
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Use refs for streaming state to avoid closure issues
  const streamingStateRef = useRef({
    currentMessage: '',
    messageIndex: -1
  });

  // Load thread_id and messages from LangGraph (PostgreSQL) on mount
  useEffect(() => {
    if (!userId) return;

    const loadThreadData = async () => {
      const savedThreadId = localStorage.getItem(`agent_thread_${userId}`);

      if (savedThreadId) {
        setStatus(prev => ({ ...prev, threadId: savedThreadId }));
        console.log(`📝 Loaded thread ID: ${savedThreadId}`);
        
        // Fetch messages from LangGraph (PostgreSQL) - single source of truth
        try {
          const token = await getToken();
          if (!token) {
            console.error('No auth token available');
            return;
          }

          const response = await fetchBackendAuth(`/api/agent/threads/${savedThreadId}/messages`, token);
          const data = await response.json();
          
          if (data.success && data.messages && data.messages.length > 0) {
            const userCount = data.messages.filter((m: any) => m.role === 'user').length;
            const assistantCount = data.messages.filter((m: any) => m.role === 'assistant').length;
            
            console.log(`💬 Loaded ${data.messages.length} messages from LangGraph (${userCount} user, ${assistantCount} assistant)`);
            console.log('📋 Sample messages:', data.messages.slice(0, 5).map((m: any) => ({ role: m.role, content: m.content.substring(0, 30) })));
            
            const mappedMessages = data.messages.map((m: any) => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
            }));
            
            console.log('🎨 Setting messages state with:', mappedMessages.length, 'messages');
            console.log('🎨 First 3 messages:', mappedMessages.slice(0, 3).map((m: any) => ({ role: m.role, content: m.content.substring(0, 30) })));
            
            setMessages(mappedMessages);
          } else {
            console.log(`📝 No messages found for thread ${savedThreadId}`);
          }
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      }
    };
    
    loadThreadData();
  }, [userId]);

  // Subscribe to shared WebSocket for agent messages
  useEffect(() => {
    if (!userId) {
      console.log('⚠️ No userId, not subscribing to WebSocket');
      return;
    }

    console.log('🎧 Subscribing to WebSocket for agent messages...');
    const unsubscribe = subscribe((data) => {
      console.log('🔔 WebSocket message received in agent-control-card:', data);
      
      // Only handle agent-related messages
      if (!data.type?.startsWith('AGENT_')) {
        console.log('⏭️ Skipping non-agent message:', data.type);
        return;
      }
      
      console.log('📨 Agent message:', data);

      if (data.type === 'AGENT_STARTED') {
        setStatus({
          isRunning: true,
          currentTask: data.task,
          threadId: data.thread_id
        });
        // Reset streaming state
        streamingStateRef.current.currentMessage = '';
        streamingStateRef.current.messageIndex = -1;
      } 
      else if (data.type === 'AGENT_TOKEN') {
        // Real-time token streaming from LangGraph
        const token = data.token || '';
        
        if (token) {
          // Update streaming message
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            // Check if we need to create a new assistant message or update existing one
            if (!lastMessage || lastMessage.role !== 'assistant' || streamingStateRef.current.messageIndex === -1) {
              // Create new assistant message
              streamingStateRef.current.currentMessage = token;
              streamingStateRef.current.messageIndex = newMessages.length;
              newMessages.push({
                role: 'assistant',
                content: token,
                timestamp: new Date()
              });
              console.log('🆕 Created new streaming message, first token:', token.substring(0, 20));
            } else {
              // Append to existing streaming message
              streamingStateRef.current.currentMessage += token;
              const currentContent = streamingStateRef.current.currentMessage;
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                content: currentContent
              };
              console.log('📝 Token:', token.substring(0, 10), '| Total length:', currentContent.length, '| Last 30 chars:', currentContent.substring(Math.max(0, currentContent.length - 30)));
            }
            
            return newMessages;
          });
        }
      }
      else if (data.type === 'THREAD_RECREATED') {
        // Old thread not found, using new thread
        console.log(`🔄 Thread recreated: ${data.old_thread_id} → ${data.new_thread_id}`);
        setStatus(prev => ({ 
          ...prev, 
          threadId: data.new_thread_id 
        }));
        addMessage('system', `ℹ️ ${data.message || 'Starting fresh conversation.'}`);
      }
      else if (data.type === 'AGENT_STOPPING') {
        // Agent is stopping, show notification
        console.log('🛑 Agent is stopping...');
        addMessage('system', `🛑 ${data.message || 'Stopping agent execution...'}`);
      }
      else if (data.type === 'AGENT_CANCELLED') {
        setStatus(prev => ({ ...prev, isRunning: false }));
        
        // Add cancellation message
        addMessage('system', '🛑 Agent execution cancelled');
        
        console.log(`🛑 Agent cancelled`);
        
        // Reset streaming state
        streamingStateRef.current.currentMessage = '';
        streamingStateRef.current.messageIndex = -1;
      }
      else if (data.type === 'AGENT_COMPLETED') {
        setStatus(prev => ({ ...prev, isRunning: false }));
        
        // Messages are already persisted in PostgreSQL via LangGraph
        console.log(`✅ Agent completed - messages saved in PostgreSQL`);
        
        // Reset streaming state
        streamingStateRef.current.currentMessage = '';
        streamingStateRef.current.messageIndex = -1;
      }
      else if (data.type === 'AGENT_ERROR') {
        setStatus(prev => ({ ...prev, isRunning: false }));
        addMessage('system', `❌ Error: ${data.error}`);
        // Reset streaming state
        streamingStateRef.current.currentMessage = '';
        streamingStateRef.current.messageIndex = -1;
      }
    });

    return unsubscribe;
  }, [userId, subscribe]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      // Force scroll to bottom with a slight delay to ensure DOM is updated
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages]);

  // Also scroll on every render during streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  // Messages are now persisted in PostgreSQL via LangGraph
  // No need to save to localStorage anymore - backend is source of truth

  // Save thread_id to localStorage whenever it changes
  useEffect(() => {
    if (!userId || !status.threadId) return;

    localStorage.setItem(`agent_thread_${userId}`, status.threadId);
    console.log(`💾 Saved thread ID: ${status.threadId}`);
  }, [status.threadId, userId]);

  const addMessage = (role: Message['role'], content: string) => {
    const newMessage = {
      role,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    // No localStorage - LangGraph is the single source of truth
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userId) return;
    
    // Allow sending while agent is running (double-texting)
    // The backend will automatically use rollback strategy

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    addMessage('user', userMessage);

    try {
      const token = await getToken();
      if (!token) {
        addMessage('system', '❌ Authentication required. Please sign in again.');
        return;
      }

      const response = await fetchBackendAuth('/api/agent/run', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          task: userMessage,
          thread_id: status.threadId  // Pass existing thread_id to continue conversation
        })
      });

      const result = await response.json();

      if (!result.success) {
        addMessage('system', `❌ Error: ${result.error}`);
      } else if (result.thread_id) {
        // Update thread_id if returned (for new threads)
        setStatus(prev => ({ ...prev, threadId: result.thread_id }));
      }
    } catch (error) {
      console.error('Error starting agent:', error);
      addMessage('system', `❌ Failed to start agent: ${error}`);
    }
  };

  const handleStopAgent = async () => {
    if (!status.threadId) return;

    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const response = await fetchBackendAuth('/api/agent/stop', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: status.threadId
        })
      });

      const result = await response.json();
      if (result.success) {
        setStatus(prev => ({ ...prev, isRunning: false }));
        addMessage('system', '🛑 Agent stopped');
      }
    } catch (error) {
      console.error('Error stopping agent:', error);
    }
  };

  const handleNewChat = async () => {
    if (!userId) return;

    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const response = await fetchBackendAuth('/api/agent/threads/new', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const result = await response.json();

      if (result.success) {
        // Clear UI and set new thread_id
        setMessages([]);
        setStatus({ isRunning: false, currentTask: null, threadId: result.thread_id });

        // Update current thread in localStorage (only thread ID, not messages)
        localStorage.setItem(`agent_thread_${userId}`, result.thread_id);

        console.log(`✨ Started new chat with thread: ${result.thread_id}`);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleThreadSelect = async (threadId: string) => {
    if (!userId) return;

    try {
      console.log(`📖 Loading messages for thread: ${threadId}`);

      const token = await getToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      // Fetch messages from backend (PostgreSQL via LangGraph)
      const response = await fetchBackendAuth(`/api/agent/threads/${threadId}/messages`, token);
      const data = await response.json();
      
      if (data.success && data.messages) {
        setMessages(data.messages.map((m: any) => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
        })));
        console.log(`✅ Loaded ${data.messages.length} messages from PostgreSQL`);
      } else {
        // No messages found, start fresh
        setMessages([]);
        console.log(`📝 No messages found for thread ${threadId}`);
      }

      // Update current thread
      setStatus(prev => ({ ...prev, threadId }));
      localStorage.setItem(`agent_thread_${userId}`, threadId);
      
      console.log(`📝 Switched to thread: ${threadId}`);
    } catch (error) {
      console.error('Error switching thread:', error);
      // Fallback to empty messages on error
      setMessages([]);
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat History Sidebar - Resizable */}
      {showHistory && (
        <ResizableSidebar 
          defaultWidth={256} 
          minWidth={200} 
          maxWidth={500}
          side="left"
          storageKey="chat-history-width"
        >
          <ChatHistorySidebar
            currentThreadId={status.threadId}
            onThreadSelect={handleThreadSelect}
            onNewChat={handleNewChat}
          />
        </ResizableSidebar>
      )}
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b p-4 bg-background">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">AI Agent Control</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* History Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="h-7"
              >
                <History className="h-3 w-3 mr-1" />
                {showHistory ? 'Hide' : 'History'}
              </Button>
              
              {/* New Chat Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                disabled={status.isRunning}
                className="h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Chat
              </Button>
            
            {status.isRunning ? (
              <>
                <Badge variant="default" className="bg-green-500">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Running
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStopAgent}
                >
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </>
            ) : (
              <Badge variant="secondary">Idle</Badge>
            )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Chat with your AI agent to automate X growth tasks
          </p>
        </div>

        {/* Chat Messages - Flexible height */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-full">
              <Sparkles className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask your Parallel Universe AI agent to engage with posts, like content, or grow your X account.
              </p>
              <div className="mt-6 space-y-2 text-left">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setInput("Find and engage with 5 posts about AI")}
                >
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Find and engage with 5 posts about AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setInput("Like 10 posts about machine learning")}
                >
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Like 10 posts about machine learning
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full p-4 overflow-y-auto" ref={scrollRef as any}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role !== 'user' && (
                      <div className={`flex-shrink-0 ${
                        message.role === 'system' ? 'text-muted-foreground' : 'text-purple-500'
                      }`}>
                        {message.role === 'system' ? (
                          <Sparkles className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] break-words ${
                        message.role === 'user'
                          ? 'bg-purple-500 text-white'
                          : message.role === 'system'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden">
                          <ReactMarkdown
                            components={{
                              code(props) {
                                const {node, inline, className, children, ...rest} = props as any;
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...rest}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...rest}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 text-purple-500">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 border-t p-4 bg-background space-y-2">
          {/* Status Info */}
          {status.currentTask && (
            <div className="text-xs text-muted-foreground">
              Current task: {status.currentTask}
            </div>
          )}
          
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              placeholder={status.isRunning ? "Type a new message to interrupt..." : "Ask your agent to do something..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={false}  // Always enabled for double-texting
              className="flex-1 min-h-[44px] max-h-[200px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="bg-purple-500 hover:bg-purple-600 h-[44px]"
            >
              {status.isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

