/**
 * Early Access Request API Route
 * PUBLIC endpoint - no authentication required
 *
 * Proxies to backend /api/early-access which:
 * - Saves request to database
 * - Sends email notification to founder
 */

import { MAIN_BACKEND_URL } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Early Access] Submitting request:', body.email);

    const response = await fetch(`${MAIN_BACKEND_URL}/api/early-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Early Access] Backend error:', data);
      return NextResponse.json(
        { error: data.detail || 'Failed to submit request' },
        { status: response.status }
      );
    }

    console.log('[Early Access] Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Early Access] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit early access request' },
      { status: 500 }
    );
  }
}
