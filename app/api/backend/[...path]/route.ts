/**
 * Proxy for Main Backend (WebSocket Server & API)
 * Routes: /api/backend/*
 * Target: MAIN_BACKEND_URL
 */

import { authenticatedFetch } from '@/lib/auth';
import { MAIN_BACKEND_URL } from '@/lib/config';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  const path = params.path;
  const pathStr = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${MAIN_BACKEND_URL}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

  console.log(`[Backend Proxy] ${request.method} ${url}`);

  try {
    let body = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else {
        body = await request.text();
      }
    }

    // Forward the Authorization header from the client request
    const headers: Record<string, string> = {
      'Content-Type': request.headers.get('content-type') || 'application/json',
    };

    // Pass through the client's Authorization header (Clerk token)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await authenticatedFetch(url, {
      method: request.method,
      headers,
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
    console.error('[Backend Proxy] Error:', error);
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
