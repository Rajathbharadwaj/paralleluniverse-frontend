/**
 * Centralized configuration for backend URLs
 * Automatically switches between development (localhost) and production (Cloud Run)
 */

// Direct backend URLs (for server-side use)
export const EXTENSION_BACKEND_URL =
  process.env.NEXT_PUBLIC_EXTENSION_BACKEND_URL || 'http://localhost:8001';

export const MAIN_BACKEND_URL =
  process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8002';

export const OMNIPARSER_URL =
  process.env.NEXT_PUBLIC_OMNIPARSER_URL || 'http://localhost:8003';

// Check if running on Cloud Run
const IS_CLOUD_RUN = typeof window === 'undefined' && !!process.env.K_SERVICE;

// Proxy URLs for client-side use (routes through Next.js API)
export const EXTENSION_PROXY_URL = '/api/extension';
export const BACKEND_PROXY_URL = '/api/backend';
export const OMNIPARSER_PROXY_URL = '/api/omniparser';

/**
 * Get the appropriate URL for making API calls
 * - On Cloud Run: uses direct URLs (server-side)
 * - In browser: uses proxy URLs (goes through Next.js API routes)
 * - Local dev: uses localhost URLs
 */
export const getApiUrl = (service: 'extension' | 'backend' | 'omniparser') => {
  // In browser, always use proxy
  if (typeof window !== 'undefined') {
    switch (service) {
      case 'extension': return EXTENSION_PROXY_URL;
      case 'backend': return BACKEND_PROXY_URL;
      case 'omniparser': return OMNIPARSER_PROXY_URL;
    }
  }

  // Server-side: use direct URLs
  switch (service) {
    case 'extension': return EXTENSION_BACKEND_URL;
    case 'backend': return MAIN_BACKEND_URL;
    case 'omniparser': return OMNIPARSER_URL;
  }
};

// WebSocket URL (auto-convert http/https to ws/wss)
export const getWebSocketURL = (path: string) => {
  // In browser on production, use the proxy pattern
  if (typeof window !== 'undefined' && IS_CLOUD_RUN) {
    // WebSocket connections need special handling - see AUTHENTICATION.md
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/ws${path}`;
  }

  // Development or server-side
  const wsUrl = MAIN_BACKEND_URL
    .replace('https://', 'wss://')
    .replace('http://', 'ws://');
  return `${wsUrl}${path}`;
};

// Environment check
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
