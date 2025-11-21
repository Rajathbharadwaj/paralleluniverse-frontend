/**
 * Proxy for OmniParser Server
 * Routes: /api/omniparser/*
 * Target: OMNIPARSER_URL
 */

import { authenticatedFetch } from '@/lib/auth';
import { OMNIPARSER_URL } from '@/lib/config';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  const path = params.path;
  const pathStr = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${OMNIPARSER_URL}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

  console.log(`[OmniParser Proxy] ${request.method} ${url}`);

  try {
    let body = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else if (contentType?.includes('multipart/form-data')) {
        // For file uploads
        body = await request.formData();
      } else {
        body = await request.text();
      }
    }

    const response = await authenticatedFetch(url, {
      method: request.method,
      headers: request.headers.get('content-type')
        ? { 'Content-Type': request.headers.get('content-type')! }
        : {},
      body,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('[OmniParser Proxy] Error:', error);
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}
