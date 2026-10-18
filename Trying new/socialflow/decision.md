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
- **[app/page.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/app/page.tsx)**: Main dashboard presenting scheduled counts, publish success rates, and quick platform health indicators.
- **[app/upload/page.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/app/upload/page.tsx)**: Publishing studio for video upload, caption formatting, hashtag tagging, platform toggling, and date/time scheduling.
- **[app/scheduled/page.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/app/scheduled/page.tsx)**: Timeline queue of pending posts with rescheduling and deletion options.
- **[app/history/page.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/app/history/page.tsx)**: Audit trail showing published media IDs, timestamps, and error logs for failed dispatches.
- **[app/accounts/page.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/app/accounts/page.tsx)**: Account connection center for starting OAuth flows for Google/YouTube and Meta/Instagram.
- **[components/Sidebar.tsx](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/components/Sidebar.tsx)**: Persistent dark-mode navigation bar.

### 2.3 Platform Integration Modules (`lib/platforms/`)
- **[youtube.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/lib/platforms/youtube.ts)**:
  - Integrates with Google APIs via `googleapis`.
  - Implements OAuth 2.0 token refreshes and resumable video uploads into YouTube Data API v3 (`youtube.upload`).
  - Sets video privacy (`public`, `unlisted`, `private`) and category mappings.
- **[instagram.ts](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/socialflow/lib/platforms/instagram.ts)**:
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
