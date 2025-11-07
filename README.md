# X Automation SaaS - Frontend

Beautiful, modern UI for your X automation SaaS built with Next.js 16, React 19, and Tailwind CSS.

## 🚀 Features

- **Dashboard** - Overview of your X account connection and automation status
- **Connect X Account** - Secure VNC viewer for one-time X login (no password sharing!)
- **Automation Controls** - Like posts, follow users, comment on posts
- **Recent Activity** - Track all your automation jobs in real-time
- **Dark Mode** - Beautiful dark theme by default
- **Responsive** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Next.js 16** - Latest React framework with App Router
- **React 19** - Latest React with Server Components
- **Tailwind CSS v4** - Utility-first CSS
- **shadcn/ui** - Beautiful, accessible components
- **TypeScript** - Type-safe development
- **Turbopack** - Super fast builds

## 📦 Installation

Already installed! Just run:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## 🔌 Connecting to Backend

The frontend needs to connect to your backend API. Update these files:

### 1. Environment Variables

Create `.env.local`:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_VNC_WS_URL=ws://localhost:5900
\`\`\`

### 2. API Integration

The UI has placeholder API calls marked with `// TODO`. Replace them with actual calls:

**Connect X Account** (`components/connect-x-dialog.tsx`):
\`\`\`typescript
// Start browser
await fetch('/api/onboard/connect-x', { method: 'POST' });

// Confirm login
const response = await fetch('/api/onboard/confirm-login', { method: 'POST' });
const data = await response.json();
\`\`\`

**Automation Controls** (`components/automation-controls.tsx`):
\`\`\`typescript
// Like post
await fetch('/api/automate/like-post', {
  method: 'POST',
  body: JSON.stringify({ postUrl: likeUrl })
});

// Follow user
await fetch('/api/automate/follow-user', {
  method: 'POST',
  body: JSON.stringify({ username: followUsername })
});

// Comment on post
await fetch('/api/automate/comment-on-post', {
  method: 'POST',
  body: JSON.stringify({ postUrl: commentUrl, text: commentText })
});
\`\`\`

## 🖥️ VNC Viewer Integration

The VNC viewer (for X login) is currently a placeholder. To integrate noVNC:

### Install noVNC

\`\`\`bash
npm install @novnc/novnc
\`\`\`

### Update `connect-x-dialog.tsx`

Replace the placeholder with:

\`\`\`typescript
import RFB from '@novnc/novnc/core/rfb';
import { useEffect, useRef } from 'react';

function VNCViewer({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      const rfb = new RFB(canvasRef.current, url);
      return () => rfb.disconnect();
    }
  }, [url]);
  
  return <canvas ref={canvasRef} className="w-full h-full" />;
}
\`\`\`

## 🎨 Customization

### Colors

Edit `app/globals.css` to change the color scheme:

\`\`\`css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... more colors */
}
\`\`\`

### Components

All components are in `components/` and use shadcn/ui. Customize them as needed!

## 📁 Project Structure

\`\`\`
cua-frontend/
├── app/
│   ├── layout.tsx          # Root layout (dark mode enabled)
│   ├── page.tsx            # Dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── dashboard-header.tsx
│   ├── x-account-card.tsx
│   ├── connect-x-dialog.tsx  # VNC viewer for X login
│   ├── automation-controls.tsx
│   └── recent-activity.tsx
└── lib/
    └── utils.ts            # Utility functions
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Docker

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
\`\`\`

## 🔗 Integration with Your Backend

Your backend (FastAPI) should expose these endpoints:

- `POST /api/onboard/connect-x` - Start browser, return VNC URL
- `POST /api/onboard/confirm-login` - Capture cookies, return username
- `POST /api/automate/like-post` - Trigger LangGraph agent to like post
- `POST /api/automate/follow-user` - Trigger LangGraph agent to follow
- `POST /api/automate/comment-on-post` - Trigger LangGraph agent to comment
- `GET /api/activity` - Get recent automation jobs

## 💡 Next Steps

1. **Connect to Backend** - Update API calls with your backend URL
2. **Add Authentication** - Implement login/signup (NextAuth.js recommended)
3. **Add Stripe** - Integrate subscription payments
4. **Add noVNC** - Integrate real VNC viewer for X login
5. **Add Real-time Updates** - Use WebSockets for job status updates
6. **Add Analytics** - Track user engagement and automation success rates

## 📚 Documentation

- [Next.js 16 Docs](https://nextjs.org/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Built with ❤️ using Next.js 16 and shadcn/ui**
