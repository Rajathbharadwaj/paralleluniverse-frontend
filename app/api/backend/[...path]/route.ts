/**
 * Proxy for Main Backend (WebSocket Server & API)
 * Routes: /api/backend/*
 * Target: MAIN_BACKEND_URL
 */

import { authenticatedFetch } from '@/lib/auth';
import { MAIN_BACKEND_URL } from '@/lib/config';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for AI generation endpoints

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  const path = params.path;
  const pathStr = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${MAIN_BACKEND_URL}/${pathStr}${searchParams ? `?${searchParams}` : ''}`;

  console.log(`[Backend Proxy] ${request.method} ${url}`);

  try {
    let body: BodyInit | undefined = undefined;
    const contentType = request.headers.get('content-type');

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await request.json());
      } else if (contentType?.includes('multipart/form-data')) {
        // For file uploads, pass the raw body to preserve binary data
        body = await request.arrayBuffer();
      } else {
        body = await request.text();
      }
    }

    // Forward the Authorization header from the client request
    const headers: Record<string, string> = {};

    // Only set Content-Type for non-multipart requests (let fetch set boundary for multipart)
    if (contentType && !contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType;
    } else if (contentType) {
      headers['Content-Type'] = contentType;
    } else {
      headers['Content-Type'] = 'application/json';
    }

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
