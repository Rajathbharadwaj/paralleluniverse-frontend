'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, MessageSquare, FileText } from 'lucide-react';

export function PreviewStyleCard() {
  const { user } = useUser();
  const userId = user?.id || '';

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [contentType, setContentType] = useState<'post' | 'comment'>('post');
  const [context, setContext] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!context.trim()) {
      setError('Please enter a context or topic');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Get extension user ID
      const statusResponse = await fetch('http://localhost:8001/status');
      const statusData = await statusResponse.json();
      const extensionUserId = statusData.users?.find((u: any) => u.username)?.user_id;

      if (!extensionUserId) {
        throw new Error('Please connect your X account first');
      }

      const response = await fetch('http://localhost:8002/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: extensionUserId,
          clerk_user_id: userId,
          content_type: contentType,
          context: context,
          feedback: feedback
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedContent(data.content);
        setFeedback(''); // Clear feedback after successful generation
      } else {
        setError(data.error || 'Failed to generate content');
      }
    } catch (err: any) {
      console.error('Error generating preview:', err);
      setError(err.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!feedback.trim() || !generatedContent) {
      return;
    }

    try {
      // Get extension user ID
      const statusResponse = await fetch('http://localhost:8001/status');
      const statusData = await statusResponse.json();
      const extensionUserId = statusData.users?.find((u: any) => u.username)?.user_id;

      if (!extensionUserId) {
        throw new Error('Please connect your X account first');
      }

      const response = await fetch('http://localhost:8002/api/save-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: extensionUserId,
          feedback: feedback,
          original_content: generatedContent,
          context: context
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Feedback saved');
        // Regenerate with feedback
        handleGenerate();
      } else {
        setError(data.error || 'Failed to save feedback');
      }
    } catch (err: any) {
      console.error('Error saving feedback:', err);
      setError(err.message || 'Failed to save feedback');
    }
  };

  const exampleContexts = {
    post: [
      "Share tips on building side projects quickly",
      "Discuss the future of AI agents",
      "Give advice on learning to code"
    ],
    comment: [
      "Someone posted: 'Just launched my first AI agent!'",
      "Someone asked: 'What's the best LLM for coding?'",
      "Someone shared: 'Struggling with prompt engineering'"
    ]
  };

  return (
    <Card className="w-full">
      {/* Header - Always visible */}
      <CardHeader className="cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle className="text-lg">Preview Your Writing Style</CardTitle>
              <CardDescription className="text-xs">
                See how the AI will write in your style
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Content - Collapsible */}
      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Content Type Selector */}
          <div className="flex gap-2">
            <Button
              variant={contentType === 'post' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('post')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Post
            </Button>
            <Button
              variant={contentType === 'comment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentType('comment')}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>

          {/* Example Contexts */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {exampleContexts[contentType].map((example, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted text-xs"
                  onClick={() => setContext(example)}
                >
                  {example.slice(0, 40)}...
                </Badge>
              ))}
            </div>
          </div>

          {/* Context Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {contentType === 'post' ? 'What should the post be about?' : 'What post are you replying to?'}
            </label>
            <Textarea
              placeholder={
                contentType === 'post'
                  ? 'e.g., Share tips on building side projects quickly'
                  : 'e.g., Someone posted: "Just launched my first AI agent!"'
              }
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !context.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Preview
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="p-4 bg-muted rounded-lg border-2 border-purple-200">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Generated {contentType}:</p>
                <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
              </div>

              {/* Feedback Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Not quite right? Tell us what to change:</label>
                <Textarea
                  placeholder="e.g., Make it more casual, add more technical details, make it shorter..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  onClick={handleSaveFeedback}
                  disabled={!feedback.trim() || isGenerating}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Regenerate with Feedback
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

