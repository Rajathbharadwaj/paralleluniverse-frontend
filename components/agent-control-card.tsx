'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
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
import { ResizableSidebar } from './resizable-sidebar';

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
  const userId = user?.id || '';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AgentStatus>({
    isRunning: false,
    currentTask: null,
    threadId: null
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Load thread_id and messages from localStorage on mount
  useEffect(() => {
    if (!userId) return;

    const savedThreadId = localStorage.getItem(`agent_thread_${userId}`);
    const savedMessages = localStorage.getItem(`agent_messages_${userId}`);

    if (savedThreadId) {
      setStatus(prev => ({ ...prev, threadId: savedThreadId }));
      console.log(`📝 Loaded thread ID: ${savedThreadId}`);
    }

    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
        console.log(`💬 Loaded ${parsed.length} messages from history`);
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }
  }, [userId]);

  // Connect to WebSocket
  useEffect(() => {
    if (!userId) return;

    const websocket = new WebSocket(`ws://localhost:8002/ws/extension/${userId}`);
    
    websocket.onopen = () => {
      console.log('✅ Agent WebSocket connected');
      setWs(websocket);
    };

    let currentStreamingMessage = '';
    let streamingMessageIndex = -1;

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Agent message:', data);

      if (data.type === 'AGENT_STARTED') {
        setStatus({
          isRunning: true,
          currentTask: data.task,
          threadId: data.thread_id
        });
        // Reset streaming state
        currentStreamingMessage = '';
        streamingMessageIndex = -1;
      } 
      else if (data.type === 'AGENT_TOKEN') {
        // Real-time token streaming from LangGraph
        const token = data.token || '';
        
        if (token) {
          currentStreamingMessage += token;
          
          // Create or update the streaming message
          setMessages(prev => {
            const newMessages = [...prev];
            
            if (streamingMessageIndex === -1) {
              // Create new assistant message
              newMessages.push({
                role: 'assistant',
                content: currentStreamingMessage,
                timestamp: new Date()
              });
              streamingMessageIndex = newMessages.length - 1;
            } else {
              // Update existing streaming message
              newMessages[streamingMessageIndex] = {
                ...newMessages[streamingMessageIndex],
                content: currentStreamingMessage
              };
            }
            
            return newMessages;
          });
        }
      }
      else if (data.type === 'AGENT_COMPLETED') {
        setStatus(prev => ({ ...prev, isRunning: false }));
        // Reset streaming state
        currentStreamingMessage = '';
        streamingMessageIndex = -1;
      }
      else if (data.type === 'AGENT_ERROR') {
        setStatus(prev => ({ ...prev, isRunning: false }));
        addMessage('system', `❌ Error: ${data.error}`);
        // Reset streaming state
        currentStreamingMessage = '';
        streamingMessageIndex = -1;
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ Agent WebSocket error:', error);
    };

    return () => {
      websocket.close();
    };
  }, [userId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      // ScrollArea component has a viewport div inside
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  // Also scroll on every render during streaming
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    };
    
    // Use requestAnimationFrame for smooth scrolling during streaming
    const rafId = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(rafId);
  });

  // Save messages to localStorage whenever they change (per thread)
  useEffect(() => {
    if (!userId || !status.threadId || messages.length === 0) return;

    localStorage.setItem(`agent_messages_${userId}_${status.threadId}`, JSON.stringify(messages));
    console.log(`💾 Saved ${messages.length} messages for thread ${status.threadId}`);
  }, [messages, userId, status.threadId]);

  // Save thread_id to localStorage whenever it changes
  useEffect(() => {
    if (!userId || !status.threadId) return;

    localStorage.setItem(`agent_thread_${userId}`, status.threadId);
    console.log(`💾 Saved thread ID: ${status.threadId}`);
  }, [status.threadId, userId]);

  const addMessage = (role: Message['role'], content: string) => {
    setMessages(prev => [...prev, {
      role,
      content,
      timestamp: new Date()
    }]);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userId || status.isRunning) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    addMessage('user', userMessage);

    try {
      const response = await fetch('http://localhost:8002/api/agent/run', {
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
      const response = await fetch('http://localhost:8002/api/agent/stop', {
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
      const response = await fetch('http://localhost:8002/api/agent/threads/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const result = await response.json();
      
      if (result.success) {
        // Clear messages and set new thread_id
        setMessages([]);
        setStatus({ isRunning: false, currentTask: null, threadId: result.thread_id });
        
        // Clear localStorage
        localStorage.removeItem(`agent_messages_${userId}`);
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
      // Load messages from localStorage for this thread
      const savedMessages = localStorage.getItem(`agent_messages_${userId}_${threadId}`);
      
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } else {
        // No saved messages, start fresh
        setMessages([]);
      }

      // Update current thread
      setStatus(prev => ({ ...prev, threadId }));
      localStorage.setItem(`agent_thread_${userId}`, threadId);
      
      console.log(`📝 Switched to thread: ${threadId}`);
    } catch (error) {
      console.error('Error switching thread:', error);
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
                Ask your AI agent to engage with posts, like content, or grow your X account.
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
            <ScrollArea className="flex-1 w-full p-4" ref={scrollRef}>
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
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : message.role === 'system'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
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
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
            </ScrollArea>
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
              placeholder="Ask your agent to do something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={status.isRunning}
              className="flex-1 min-h-[44px] max-h-[200px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || status.isRunning}
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

