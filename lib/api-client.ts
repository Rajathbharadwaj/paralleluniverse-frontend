/**
 * Centralized API client with automatic proxy routing
 * Use these instead of direct fetch() calls to ensure proper authentication
 */

import { getApiUrl } from './config';

/**
 * Fetch from Extension Backend (port 8001)
 * Automatically routes through /api/extension proxy in browser
 */
export async function fetchExtension(path: string, options?: RequestInit) {
  const baseUrl = getApiUrl('extension');
  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  return fetch(url, options);
}

/**
 * Fetch from Main Backend (port 8002)
 * Automatically routes through /api/backend proxy in browser
 */
export async function fetchBackend(path: string, options?: RequestInit) {
  const baseUrl = getApiUrl('backend');
  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  return fetch(url, options);
}

/**
 * Fetch from OmniParser (port 8003)
 * Automatically routes through /api/omniparser proxy in browser
 */
export async function fetchOmniParser(path: string, options?: RequestInit) {
  const baseUrl = getApiUrl('omniparser');
  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  return fetch(url, options);
}

/**
 * Helper to make JSON POST requests
 */
export async function postJSON(
  fetchFn: typeof fetchExtension,
  path: string,
  data: any
) {
  return fetchFn(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Helper to make JSON PUT requests
 */
export async function putJSON(
  fetchFn: typeof fetchExtension,
  path: string,
  data: any
) {
  return fetchFn(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
