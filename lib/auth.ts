/**
 * Authentication utilities for Cloud Run service-to-service calls
 *
 * When running on Cloud Run, this automatically fetches identity tokens
 * from the metadata server to authenticate requests to other services.
 */

import { EXTENSION_BACKEND_URL, MAIN_BACKEND_URL, OMNIPARSER_URL } from './config';

/**
 * Get identity token for service-to-service authentication on Cloud Run
 * Returns null when running locally (not on Cloud Run)
 */
async function getIdentityToken(audience: string): Promise<string | null> {
  // Only attempt to get token if running on Cloud Run
  if (!process.env.K_SERVICE) {
    return null;
  }

  try {
    const metadataServer = 'http://metadata.google.internal';
    const tokenUrl = `${metadataServer}/computeMetadata/v1/instance/service-accounts/default/identity?audience=${audience}`;

    const response = await fetch(tokenUrl, {
      headers: {
        'Metadata-Flavor': 'Google',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch identity token:', response.statusText);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching identity token:', error);
    return null;
  }
}

/**
 * Create fetch options with authentication for Cloud Run
 */
export async function getAuthenticatedFetchOptions(
  url: string,
  options: RequestInit = {}
): Promise<RequestInit> {
  const token = await getIdentityToken(url);

  if (!token) {
    // Running locally, no authentication needed
    return options;
  }

  // Add authorization header for Cloud Run
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return {
    ...options,
    headers,
  };
}

/**
 * Authenticated fetch wrapper for Cloud Run services
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authOptions = await getAuthenticatedFetchOptions(url, options);
  return fetch(url, authOptions);
}
