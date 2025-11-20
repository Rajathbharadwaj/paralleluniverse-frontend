/**
 * API client for scheduled posts
 * Connects frontend to backend at localhost:8002
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

export interface ScheduledPost {
  id: number;
  content: string;
  media_urls: string[];
  status: "draft" | "scheduled" | "posted" | "failed";
  scheduled_at: string;
  posted_at?: string;
  ai_generated?: boolean;
  ai_confidence?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePostData {
  user_id: string;
  content: string;
  media_urls?: string[];
  scheduled_at: string;
  status?: "draft" | "scheduled";
}

export interface UpdatePostData {
  content?: string;
  media_urls?: string[];
  scheduled_at?: string;
  status?: string;
}

/**
 * Fetch scheduled posts for a user within a date range
 */
export async function fetchScheduledPosts(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ScheduledPost[]> {
  const params = new URLSearchParams({ user_id: userId });

  if (startDate) {
    params.append("start_date", startDate.toISOString());
  }
  if (endDate) {
    params.append("end_date", endDate.toISOString());
  }

  const response = await fetch(`${API_BASE_URL}/api/scheduled-posts?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch scheduled posts: ${response.statusText}`);
  }

  const data = await response.json();
  return data.posts || [];
}

/**
 * Create a new scheduled post
 */
export async function createScheduledPost(postData: CreatePostData): Promise<ScheduledPost> {
  const response = await fetch(`${API_BASE_URL}/api/scheduled-posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create scheduled post: ${response.statusText}`);
  }

  const data = await response.json();
  return data.post;
}

/**
 * Update an existing scheduled post
 */
export async function updateScheduledPost(
  postId: number,
  updateData: UpdatePostData
): Promise<ScheduledPost> {
  const response = await fetch(`${API_BASE_URL}/api/scheduled-posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update scheduled post: ${response.statusText}`);
  }

  const data = await response.json();
  return data.post;
}

/**
 * Delete a scheduled post
 */
export async function deleteScheduledPost(postId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scheduled-posts/${postId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete scheduled post: ${response.statusText}`);
  }
}

/**
 * Upload a media file and get back the URL
 */
export async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload media: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Fetch AI-generated draft posts
 */
export async function fetchAIDrafts(
  userId: string
): Promise<Array<{
  id: number;
  content: string;
  scheduled_at: string;
  confidence: number;
  ai_generated: boolean;
}>> {
  const params = new URLSearchParams({ user_id: userId });

  const response = await fetch(
    `${API_BASE_URL}/api/scheduled-posts/ai-drafts?${params}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch AI drafts: ${response.statusText}`);
  }

  const data = await response.json();
  return data.posts || [];
}

/**
 * Generate AI content suggestions
 */
export async function generateAIContent(
  userId: string,
  count: number = 5
): Promise<Array<{
  id: number;  // Database ID
  content: string;
  scheduled_at: string;
  confidence: number;
  ai_generated: boolean;
}>> {
  const params = new URLSearchParams({
    user_id: userId,
    count: count.toString(),
  });

  const url = `${API_BASE_URL}/api/scheduled-posts/generate-ai?${params}`;
  console.log("🌐 Fetching AI content from:", url);
  console.log("📊 Request params:", { userId, count });

  try {
    const response = await fetch(url, {
      method: "POST",
    });

    console.log("📥 Response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Response not OK:", errorText);
      throw new Error(`Failed to generate AI content: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("📦 Response data:", {
      success: data.success,
      count: data.count,
      postsLength: data.posts?.length,
      message: data.message
    });

    return data.posts || [];
  } catch (error) {
    console.error("❌ Error in generateAIContent:", error);
    throw error;
  }
}
