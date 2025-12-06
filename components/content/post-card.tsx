"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Image as ImageIcon,
  Video,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Post {
  id: string;
  content: string;
  media: { type: string; url: string }[];
  status: "draft" | "scheduled" | "posted" | "failed";
  date: Date;
  time: string;
  postedAt?: string;
}

interface PostCardProps {
  post: Post;
  compact?: boolean;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onDuplicate?: (postId: string) => void;
  onPreview?: (postId: string) => void;
}

export function PostCard({ post, compact = false, onEdit, onDelete, onDuplicate, onPreview }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = {
    draft: {
      icon: FileText,
      color: "bg-gray-500",
      label: "Draft",
      badgeVariant: "secondary" as const
    },
    scheduled: {
      icon: Clock,
      color: "bg-blue-500",
      label: "Scheduled",
      badgeVariant: "default" as const
    },
    posted: {
      icon: CheckCircle2,
      color: "bg-green-500",
      label: "Posted",
      badgeVariant: "default" as const
    },
    failed: {
      icon: XCircle,
      color: "bg-red-500",
      label: "Failed",
      badgeVariant: "destructive" as const
    }
  };

  const status = statusConfig[post.status];
  const StatusIcon = status.icon;

  // Truncate content for compact view
  const displayContent = compact && post.content.length > 80
    ? post.content.substring(0, 80) + "..."
    : post.content;

  // Get media type icon
  const getMediaIcon = () => {
    if (post.media.length === 0) return null;

    const hasImage = post.media.some(m => m.type === "image");
    const hasVideo = post.media.some(m => m.type === "video");

    if (hasVideo) return <Video className="h-4 w-4" />;
    if (hasImage) return <ImageIcon className="h-4 w-4" />;
    return null;
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md ${
        compact ? "p-3" : "p-4"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${status.color}`}></div>

      <div className="pl-2 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <Badge variant={status.badgeVariant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>

          {(onEdit || onDelete || onPreview || onDuplicate) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onPreview && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onPreview(post.id);
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit(post.id);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(post.id);
                  }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(post.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Media Thumbnail (if exists) */}
        {post.media.length > 0 && (
          <div className="relative w-full h-20 bg-muted rounded overflow-hidden">
            {post.media[0].type === "image" ? (
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {post.media.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                +{post.media.length - 1}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <p className={`text-sm ${post.media.length > 0 ? "line-clamp-2" : "line-clamp-3"}`}>
          {displayContent}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {getMediaIcon()}
            {post.status === "posted" && post.postedAt ? (
              <span className="text-green-600 font-medium" suppressHydrationWarning>Posted {post.postedAt}</span>
            ) : (
              <span suppressHydrationWarning>{post.time}</span>
            )}
          </div>
          {post.content.length > 0 && (
            <span>{post.content.length}/280</span>
          )}
        </div>
      </div>
    </Card>
  );
}
