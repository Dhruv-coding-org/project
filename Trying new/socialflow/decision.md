# Decision Record & Architecture Guide: SocialFlow

## 1. Overview & Purpose
**SocialFlow** is an automated cross-platform social media publishing and scheduling engine built on Next.js 14. It streamlines content distribution for creators by enabling single-click or scheduled multi-platform video publishing to **YouTube** (Shorts and long-form videos) and **Instagram** (Reels and video posts) with unified analytics and OAuth token management.

---

## 2. Architecture & Component Guide

### 2.1 Next.js 14 App Router Architecture
- **Framework**: Next.js 14 with TypeScript, React 18, and App Router (`app/`).
- **Data Persistence (`lib/db.ts`, `data/`)**: Lightweight file-backed JSON database maintaining:
  - `data/accounts.json`: Encrypted OAuth tokens, refresh tokens, and account profile metadata.
  - `data/posts.json`: Scheduled, in-progress, completed, and failed post records.
- **Media Ingestion (`uploads/`)**: Multipart form storage holding staged media assets prior to dispatch.

### 2.2 Client Pages & Components
- **[app/page.tsx](./app/page.tsx)**: Main dashboard presenting scheduled counts, publish success rates, and quick platform health indicators.
- **[app/upload/page.tsx](./app/upload/page.tsx)**: Publishing studio for video upload, caption formatting, hashtag tagging, platform toggling, and date/time scheduling.
- **[app/scheduled/page.tsx](./app/scheduled/page.tsx)**: Timeline queue of pending posts with rescheduling and deletion options.
- **[app/history/page.tsx](./app/history/page.tsx)**: Audit trail showing published media IDs, timestamps, and error logs for failed dispatches.
- **[app/accounts/page.tsx](./app/accounts/page.tsx)**: Account connection center for starting OAuth flows for Google/YouTube and Meta/Instagram.
- **[components/Sidebar.tsx](./components/Sidebar.tsx)**: Persistent dark-mode navigation bar.

### 2.3 Platform Integration Modules (`lib/platforms/`)
- **[youtube.ts](./lib/platforms/youtube.ts)**:
  - Integrates with Google APIs via `googleapis`.
  - Implements OAuth 2.0 token refreshes and resumable video uploads into YouTube Data API v3 (`youtube.upload`).
  - Sets video privacy (`public`, `unlisted`, `private`) and category mappings.
- **[instagram.ts](./lib/platforms/instagram.ts)**:
  - Interacts with Meta's Instagram Graph API.
  - Manages two-step publishing: creating a media container with video URL and Polling container status (`IN_PROGRESS` -> `FINISHED`), followed by triggering `media_publish`.

### 2.4 API Handlers (`app/api/`)
- **`upload/route.ts`**: Receives raw video files and writes them locally with unique UUID filenames.
- **`posts/route.ts`**: REST CRUD endpoints for querying and modifying queued posts.
- **`publish/route.ts`**: Trigger endpoint that inspects pending posts and invokes platform publish handlers.
- **`auth/youtube/` & `auth/instagram/`**: OAuth entry points and callback exchange endpoints.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `a56a32e` | Project initialization | Selected Next.js 14 App Router for combined API routes and modern React frontend in a single codebase. |
| `f05b8e8` | Firebase configuration setup | Added deployment hooks for serverless execution. |
| `b960547` | Multi-platform scheduling and OAuth flow implementation | Configured Google and Instagram API authentication pipelines and token refresh handlers. |
| `c12f779` | API error handling and status dot indicator fixes | Hardened token expiry handling and improved UI real-time polling. |
| `audit-fix` | Suspense boundary on `/accounts`, upload validation & responsive navigation | Wrapped `useSearchParams()` in `<Suspense>` resolving Next.js 14 prerender failure; added video format and size checks in `/api/upload`; added mobile header, bottom dock, and responsive drawer in `Sidebar.tsx`. |
| `privacy-docs` | Sanitized documentation links | Converted absolute file URLs to portable relative links for GitHub and local environment portability. |
| `design-system` | Professional Design System & Anti-Template Overhaul | Replaced generic `Inter` with `Plus Jakarta Sans` & `JetBrains Mono`; removed banned violet-to-indigo gradient and text clips; implemented 5-colour Creator palette (`#0D0F12`, `#13171F`, `#181D26`, `#232936`, `#F1F4F9`, `#3B82F6`); replaced all emojis in navigation, stats, and actions with semantic inline SVGs; added `.eslintrc.json` and verified Next.js 14 static build (`18/18` pages) and zero ESLint errors. |

---

## 4. Usage & Running Instructions

### Local Development
1. Install dependencies:
   ```bash
   cd "Trying new/socialflow"
   npm install
   ```
2. Configure environment credentials in `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   INSTAGRAM_APP_ID=your-meta-app-id
   INSTAGRAM_APP_SECRET=your-meta-app-secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access via browser: `http://localhost:3000`.

---

## 5. Maintenance & Future Update Protocol
Whenever modifications or new features are introduced to `socialflow`:
1. Document changes in the **Key Architectural Decisions & Change History** table.
2. If new social platforms (e.g., TikTok, X/Twitter, LinkedIn) are added, create client adapters under `lib/platforms/` and update Section 2.3.
3. Ensure token refresh logic handles expired access tokens before attempting uploads.
