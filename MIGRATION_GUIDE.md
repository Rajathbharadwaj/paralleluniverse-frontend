# API Client Migration Guide

## Quick Reference

Replace direct `fetch()` calls with the new API client helpers to automatically route through authentication proxies.

### Before → After

```typescript
// Extension Backend (localhost:8001)
// BEFORE:
fetch('http://localhost:8001/status')
fetch(`${process.env.NEXT_PUBLIC_EXTENSION_BACKEND_URL}/status`)

// AFTER:
import { fetchExtension } from '@/lib/api-client';
fetchExtension('/status')
fetchExtension('status')  // leading slash optional
```

```typescript
// Main Backend (localhost:8002)
// BEFORE:
fetch('http://localhost:8002/api/posts/count/username')
fetch(`${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/posts`)

// AFTER:
import { fetchBackend } from '@/lib/api-client';
fetchBackend('/api/posts/count/username')
fetchBackend('api/posts')
```

```typescript
// OmniParser (localhost:8003)
// BEFORE:
fetch('http://localhost:8003/parse')

// AFTER:
import { fetchOmniParser } from '@/lib/api-client';
fetchOmniParser('/parse')
```

### POST Requests

```typescript
// BEFORE:
fetch('http://localhost:8002/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'hello' })
})

// AFTER:
import { fetchBackend, postJSON } from '@/lib/api-client';

// Option 1: Using fetchBackend directly
fetchBackend('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'hello' })
})

// Option 2: Using postJSON helper
postJSON(fetchBackend, '/api/posts', { content: 'hello' })
```

## Automated Find & Replace

Use these regex patterns to quickly update your code:

### Pattern 1: Replace localhost URLs
```
Find:    fetch\(['"`]http://localhost:8001/
Replace: fetchExtension('/

Find:    fetch\(['"`]http://localhost:8002/
Replace: fetchBackend('/

Find:    fetch\(['"`]http://localhost:8003/
Replace: fetchOmniParser('/
```

### Pattern 2: Replace environment variable URLs
```
Find:    fetch\(\`\$\{process\.env\.NEXT_PUBLIC_EXTENSION_BACKEND_URL\}/
Replace: fetchExtension('/

Find:    fetch\(\`\$\{process\.env\.NEXT_PUBLIC_MAIN_BACKEND_URL\}/
Replace: fetchBackend('/

Find:    fetch\(\`\$\{process\.env\.NEXT_PUBLIC_OMNIPARSER_URL\}/
Replace: fetchOmniParser('/
```

## Files That Need Updates

Based on grep results, these files contain backend API calls:

- ✅ `/lib/api/scheduled-posts.ts` - ALREADY UPDATED
- `/app/page.tsx` - 4 calls
- `/app/content/page.tsx` - 1 call
- `/app/competitors/page.tsx` - 14 calls
- `/contexts/websocket-context.tsx` - 1 WebSocket call (needs special handling)
- `/components/import-posts-card.tsx` - 4 calls
- `/components/agent-control-card.tsx` - 5 calls
- `/components/setup-status-bar.tsx` - 2 calls
- `/components/recent-activity-live.tsx` - 2 calls (1 fetch, 1 WebSocket)
- `/components/connect-extension-dialog.tsx` - 2 calls
- `/components/workflow-builder.tsx` - 2 calls
- `/components/workflow-execution-panel.tsx` - 1 WebSocket call
- `/components/workflow-library.tsx` - 2 calls
- `/components/preview-style-card.tsx` - 6 calls
- `/components/x-account-card.tsx` - 1 call
- `/components/chat-history-sidebar.tsx` - 1 call

## WebSocket Special Handling

WebSocket connections can't go through HTTP proxies. You'll need to create a WebSocket proxy using Next.js or use a different approach.

For now, WebSocket calls will work in development but may need adjustments for production.

## Testing

1. **Local Development**: No changes needed - still uses localhost
2. **Production**: All calls automatically route through `/api/extension`, `/api/backend`, `/api/omniparser` proxies

## Need Help?

See `AUTHENTICATION.md` for detailed explanation of how authentication works.
