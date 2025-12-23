/**
 * API client for Ads service
 * Handles brand assets, image generation, and campaign management
 */

import { getApiUrl } from '../config';

const API_BASE_URL = typeof window !== 'undefined'
  ? getApiUrl('backend')
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002");

// =============================================================================
// Types
// =============================================================================

export interface UserAsset {
  id: number;
  name: string;
  asset_type: "logo" | "product" | "background" | "other";
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateAssetData {
  name: string;
  file_url: string;
  asset_type?: "logo" | "product" | "background" | "other";
  description?: string;
  thumbnail_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  width?: number;
  height?: number;
}

export interface ImageGenerationJob {
  id: number;
  prompt: string;
  aspect_ratio: string;
  resolution: string;
  input_asset_ids: number[];
  status: "pending" | "processing" | "completed" | "failed";
  result_url?: string;
  error_message?: string;
  campaign_id?: number;
  created_at: string;
  completed_at?: string;
}

export interface GenerateImageData {
  prompt: string;
  asset_ids?: number[];
  aspect_ratio?: string;
  resolution?: "1k" | "2k";
  campaign_id?: number;
  wait_for_completion?: boolean;
}

export interface AdsCampaign {
  id: number;
  platform_id: number;
  platform: "meta" | "google";
  external_campaign_id?: string;
  name: string;
  campaign_type?: string;
  objective?: string;
  status: "draft" | "active" | "paused" | "archived" | "error";
  daily_budget_cents?: number;
  total_spend_cents: number;
  targeting?: Record<string, unknown>;
  headline?: string;
  description?: string;
  destination_url?: string;
  media_url?: string;
  created_at: string;
  last_synced_at?: string;
}

// =============================================================================
// Asset Management
// =============================================================================

/**
 * Fetch all brand assets for the current user
 */
export async function fetchAssets(
  token: string,
  assetType?: "logo" | "product" | "background" | "other"
): Promise<UserAsset[]> {
  const params = new URLSearchParams();
  if (assetType) {
    params.append("asset_type", assetType);
  }

  const url = `${API_BASE_URL}/api/ads/assets${params.toString() ? `?${params}` : ""}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.statusText}`);
  }

  const data = await response.json();
  return data.assets || [];
}

/**
 * Create a new brand asset record
 * Note: File should already be uploaded to cloud storage
 */
export async function createAsset(
  assetData: CreateAssetData,
  token: string
): Promise<UserAsset> {
  const response = await fetch(`${API_BASE_URL}/api/ads/assets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(assetData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to create asset: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a brand asset (soft delete)
 */
export async function deleteAsset(assetId: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/ads/assets/${assetId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete asset: ${response.statusText}`);
  }
}

/**
 * Upload a file and create an asset record
 * This is a convenience function that combines upload + create
 */
export async function uploadAsset(
  file: File,
  name: string,
  assetType: "logo" | "product" | "background" | "other",
  token: string
): Promise<UserAsset> {
  // First upload the file
  const formData = new FormData();
  formData.append("file", file);

  const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
  }

  const uploadData = await uploadResponse.json();
  const fileUrl = uploadData.url;

  // Then create the asset record
  return createAsset({
    name,
    file_url: fileUrl,
    asset_type: assetType,
    file_size_bytes: file.size,
    mime_type: file.type,
  }, token);
}

// =============================================================================
// Image Generation
// =============================================================================

/**
 * Generate an AI image using Nano Banana Pro
 */
export async function generateImage(
  data: GenerateImageData,
  token: string
): Promise<ImageGenerationJob> {
  const response = await fetch(`${API_BASE_URL}/api/ads/generate-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt: data.prompt,
      asset_ids: data.asset_ids,
      aspect_ratio: data.aspect_ratio || "1:1",
      resolution: data.resolution || "1k",
      campaign_id: data.campaign_id,
      wait_for_completion: data.wait_for_completion ?? true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to generate image: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch image generation jobs
 */
export async function fetchImageJobs(
  token: string,
  status?: "pending" | "processing" | "completed" | "failed",
  limit: number = 20
): Promise<ImageGenerationJob[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (status) {
    params.append("status", status);
  }

  const response = await fetch(`${API_BASE_URL}/api/ads/image-jobs?${params}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image jobs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.jobs || [];
}

/**
 * Get a specific image generation job
 */
export async function getImageJob(
  jobId: number,
  token: string,
  refresh: boolean = false
): Promise<ImageGenerationJob> {
  const params = refresh ? "?refresh=true" : "";

  const response = await fetch(`${API_BASE_URL}/api/ads/image-jobs/${jobId}${params}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image job: ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// Campaign Management
// =============================================================================

/**
 * Fetch all campaigns
 */
export async function fetchCampaigns(
  token: string,
  status?: "draft" | "active" | "paused" | "archived"
): Promise<AdsCampaign[]> {
  const params = new URLSearchParams();
  if (status) {
    params.append("status", status);
  }

  const url = `${API_BASE_URL}/api/ads/campaigns${params.toString() ? `?${params}` : ""}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
  }

  const data = await response.json();
  return data.campaigns || [];
}

/**
 * Get a specific campaign
 */
export async function getCampaign(
  campaignId: number,
  token: string
): Promise<AdsCampaign> {
  const response = await fetch(`${API_BASE_URL}/api/ads/campaigns/${campaignId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch campaign: ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// Platform Management
// =============================================================================

export interface AdsPlatform {
  id: number;
  platform: "meta" | "google";
  account_id?: string;
  account_name?: string;
  is_connected: boolean;
  connection_error?: string;
  created_at: string;
  last_synced_at?: string;
}

/**
 * Fetch connected ad platforms
 */
export async function fetchPlatforms(token: string): Promise<{
  platforms: AdsPlatform[];
  meta_configured: boolean;
  google_configured: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/api/ads/platforms`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch platforms: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get OAuth URL for connecting a platform
 */
export async function getOAuthUrl(
  platform: "meta" | "google",
  token: string
): Promise<{ url: string; state: string }> {
  const response = await fetch(`${API_BASE_URL}/api/ads/oauth/${platform}/url`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to get OAuth URL: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Disconnect an ad platform
 */
export async function disconnectPlatform(
  platformId: number,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/ads/platforms/${platformId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to disconnect platform: ${response.statusText}`);
  }
}
