# Cloud Run Authentication Setup

## Overview

Your Cloud Run services are configured with **service-to-service authentication** using IAM. This prevents unauthorized access while allowing your frontend (running on Cloud Run) to communicate with backend services.

## ✅ What's Already Configured

1. **Service Account Permissions**
   - Frontend service account: `644185288504-compute@developer.gserviceaccount.com`
   - Has `roles/run.invoker` permission for all backend services:
     - `backend-api`
     - `extension-backend-service`
     - `omniparser-service`
     - `langgraph-service`

2. **Authentication Utility**
   - Location: `/lib/auth.ts`
   - Provides `authenticatedFetch()` function for making authenticated requests
   - Automatically fetches identity tokens from Cloud Run metadata server
   - Works transparently on Cloud Run, falls back to unauthenticated locally

## 🔧 How to Use Authentication

### Option 1: Direct Client-Side Calls (Simple, but has limitations)

**Problem**: Client-side code runs in the browser and can't access Cloud Run metadata server.

**Solution**: Use Next.js API routes as a proxy.

### Option 2: Server-Side API Routes (Recommended)

Create API routes in `/app/api/` that proxy requests to backend services with authentication:

```typescript
// app/api/backend/[...path]/route.ts
import { authenticatedFetch } from '@/lib/auth';
import { MAIN_BACKEND_URL } from '@/lib/config';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = `${MAIN_BACKEND_URL}/${path}`;

  const response = await authenticatedFetch(url);
  const data = await response.json();

  return Response.json(data);
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = `${MAIN_BACKEND_URL}/${path}`;
  const body = await request.json();

  const response = await authenticatedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return Response.json(data);
}
```

Then update your frontend code to use the proxy:

```typescript
// Before (direct call - won't work with auth):
const response = await fetch(`${MAIN_BACKEND_URL}/api/posts`);

// After (via proxy API route):
const response = await fetch('/api/backend/api/posts');
```

### Option 3: Server Components (Next.js 14+)

Use server components to fetch data with authentication:

```typescript
// app/posts/page.tsx
import { authenticatedFetch } from '@/lib/auth';
import { MAIN_BACKEND_URL } from '@/lib/config';

export default async function PostsPage() {
  const response = await authenticatedFetch(`${MAIN_BACKEND_URL}/api/posts`);
  const posts = await response.json();

  return <div>{/* render posts */}</div>;
}
```

## 🧪 Testing Authentication

### Test on Cloud Run

Deploy your frontend and it will automatically authenticate:

```bash
# Frontend is already deployed at:
https://frontend-bw5qfm5d5a-uc.a.run.app
```

### Test Locally

When running locally (`npm run dev`), the authentication will be skipped since you're not on Cloud Run. For local development:

1. **Option A**: Use `gcloud auth application-default login` to authenticate your local environment
2. **Option B**: Run backend services locally without authentication (development mode)
3. **Option C**: Use Cloud Run Proxy to tunnel requests

## 🔐 Security Notes

- Identity tokens are short-lived (1 hour) and automatically refreshed
- Only works between Cloud Run services (not from external clients)
- No secrets or API keys needed - uses Google Cloud IAM
- Tokens are never exposed to client-side code

## 📝 Environment Variables

Your `.env.production` already has the correct backend URLs:

```env
NEXT_PUBLIC_EXTENSION_BACKEND_URL=https://extension-backend-service-bw5qfm5d5a-uc.a.run.app
NEXT_PUBLIC_MAIN_BACKEND_URL=https://backend-api-bw5qfm5d5a-uc.a.run.app
NEXT_PUBLIC_OMNIPARSER_URL=https://omniparser-service-644185288504.us-central1.run.app
```

These URLs will return 403 Forbidden from external clients, but work fine when called from your frontend Cloud Run service.

## 🚀 Next Steps

1. Create API proxy routes for backend calls (see Option 2 above)
2. Update frontend components to use proxy routes instead of direct calls
3. Test on Cloud Run
4. Deploy updates to production

## 📚 Resources

- [Cloud Run Authentication](https://cloud.google.com/run/docs/authenticating/service-to-service)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Google Cloud Identity Tokens](https://cloud.google.com/docs/authentication/token-types#id)
