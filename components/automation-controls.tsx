"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, UserPlus, MessageSquare, Loader2 } from "lucide-react";

export function AutomationControls() {
  const [likeUrl, setLikeUrl] = useState("");
  const [followUsername, setFollowUsername] = useState("");
  const [commentUrl, setCommentUrl] = useState("");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLikePost = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call to your backend
      // This will trigger your LangGraph agent with like_post tool
      // await fetch('/api/automate/like-post', {
      //   method: 'POST',
      //   body: JSON.stringify({ postUrl: likeUrl })
      // });
      
      console.log("Liking post:", likeUrl);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      alert(`✅ Post liked successfully!`);
      setLikeUrl("");
    } catch (error) {
      alert("❌ Failed to like post");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // This will trigger your LangGraph agent with follow_user tool
      console.log("Following user:", followUsername);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`✅ Following @${followUsername}`);
      setFollowUsername("");
    } catch (error) {
      alert("❌ Failed to follow user");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentOnPost = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // This will trigger your LangGraph agent with comment_on_post tool
      console.log("Commenting on post:", commentUrl, "with:", commentText);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`✅ Comment posted successfully!`);
      setCommentUrl("");
      setCommentText("");
    } catch (error) {
      alert("❌ Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation Controls</CardTitle>
        <CardDescription>
          Trigger automated actions on X using your connected account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="like" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="like" className="gap-2">
              <Heart className="h-4 w-4" />
              Like
            </TabsTrigger>
            <TabsTrigger value="follow" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Follow
            </TabsTrigger>
            <TabsTrigger value="comment" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Comment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="like" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="like-url">Post URL</Label>
              <Input
                id="like-url"
                placeholder="https://x.com/username/status/123456789"
                value={likeUrl}
                onChange={(e) => setLikeUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste the URL of the post you want to like
              </p>
            </div>
            <Button 
              onClick={handleLikePost} 
              disabled={!likeUrl || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Liking...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Like Post
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="follow" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="follow-username">Username</Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 border rounded-l-md bg-muted text-muted-foreground">
                  @
                </span>
                <Input
                  id="follow-username"
                  placeholder="username"
                  value={followUsername}
                  onChange={(e) => setFollowUsername(e.target.value)}
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the username you want to follow (without @)
              </p>
            </div>
            <Button 
              onClick={handleFollowUser} 
              disabled={!followUsername || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Following...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Follow User
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="comment" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment-url">Post URL</Label>
              <Input
                id="comment-url"
                placeholder="https://x.com/username/status/123456789"
                value={commentUrl}
                onChange={(e) => setCommentUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment-text">Comment</Label>
              <textarea
                id="comment-text"
                placeholder="Write your comment here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {commentText.length}/280 characters
              </p>
            </div>
            <Button 
              onClick={handleCommentOnPost} 
              disabled={!commentUrl || !commentText || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

