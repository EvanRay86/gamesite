# Security Audit Report

**Date:** 2026-03-29
**Scope:** Full codebase review of gamesite (Next.js + Supabase + Stripe)

---

## CRITICAL Issues

### 1. Open Redirect in Auth Callback
**File:** `src/app/api/auth/callback/route.ts`
**Severity:** CRITICAL

The `redirect` query parameter is used directly in `NextResponse.redirect()` without validation. An attacker can craft a URL like:
```
/api/auth/callback?code=xxx&redirect=https://evil.com
```
This can be used in phishing attacks — a user clicks what looks like a legitimate login link but gets redirected to an attacker-controlled site after authentication.

**Fix:** Validate that the redirect path is relative (starts with `/` and doesn't start with `//`).

### 2. Admin API Routes Have NO Authentication
**Files:**
- `src/app/api/admin/puzzles/route.ts` (GET — dumps all puzzle data)
- `src/app/api/admin/puzzles/[type]/route.ts` (POST/PATCH/DELETE — create/modify/delete puzzles)
- `src/app/api/admin/heardle/save/route.ts` (POST — insert puzzles)
- `src/app/api/admin/heardle/search/route.ts` (GET — proxy to SoundCloud)
- `src/app/api/admin/framed/save/route.ts` (POST — save frames + write to filesystem)
- `src/app/api/admin/trailer/search/route.ts` (GET)
- `src/app/api/admin/trailer/extract/route.ts` (POST — downloads YouTube videos)
- `src/app/api/admin/trailer/frame/route.ts` (GET)

**Severity:** CRITICAL

None of these endpoints verify the user is authenticated or is an admin. Anyone on the internet can:
- Read all puzzle answers (spoil the game for all users)
- Create, modify, or delete any puzzle
- Trigger YouTube video downloads on your server
- Write files to the server filesystem via the framed save endpoint

### 3. Unprotected Content Generation Endpoints
**Files:**
- `src/app/api/trivia/generate/route.ts`
- `src/app/api/crossword/generate/route.ts`

**Severity:** HIGH

These endpoints have no authentication. An attacker could repeatedly call them to:
- Burn through your Gemini API quota/billing
- Create duplicate or unwanted puzzle entries

### 4. Command Injection Risk in Trailer Frame Extraction
**File:** `src/lib/trailer-frames.ts`
**Severity:** HIGH

The `extractFrames()` function passes a user-supplied YouTube URL directly to `yt-dlp` via `execFile`. While `execFile` is safer than `exec` (no shell interpolation), `yt-dlp` itself can be abused:
- Arbitrary URL fetching (SSRF-like behavior)
- Potential for `yt-dlp`-specific exploit payloads

The `searchTrailers()` function also passes user input to `yt-dlp` search. Combined with the lack of authentication on the admin endpoints, this is exploitable by anyone.

---

## HIGH Issues

### 5. Missing `sessionId` Validation (Path Traversal)
**File:** `src/lib/trailer-frames.ts:readFrameImage()`

While the route handler (`trailer/frame/route.ts`) validates the `file` parameter, it does NOT validate `sessionId`. An attacker could pass:
```
sessionId=../../etc
```
Combined with the filename, this could lead to arbitrary file reads on the server.

### 6. No Rate Limiting on Any API Endpoint
**Severity:** HIGH

No rate limiting exists anywhere. Critical surfaces:
- Login/signup (brute force attacks)
- Credit deduction endpoint (rapid repeated calls)
- Stripe checkout creation (resource exhaustion)
- Puzzle generation endpoints (API quota burning)

### 7. No Middleware for Route Protection
**Severity:** HIGH

There is no `middleware.ts` file. The `proxy.ts` exists but is not wired as Next.js middleware. This means there's no centralized auth check or route protection.

---

## MEDIUM Issues

### 8. Stripe Checkout `mode` Not Validated
**File:** `src/app/api/stripe/checkout/route.ts:53`

The `mode` parameter from the request body is cast with `as "subscription" | "payment"` but never actually validated. If Stripe introduces new modes or if a malformed value is sent, it relies entirely on Stripe to reject it.

### 9. Error Messages Leak Internal Details
**File:** `src/app/api/stripe/checkout/route.ts:66`

```typescript
{ error: "Failed to create checkout session", detail: message }
```
The raw error message from Stripe is included in the response. This could leak internal configuration details.

### 10. Insecure Fallback in Admin Puzzle Routes
**File:** `src/app/api/admin/puzzles/[type]/route.ts:35`

```typescript
const supabase = getSupabaseAdmin() ?? getSupabase();
```
If the admin client fails to initialize, it falls back to the anon client. This is misleading and could bypass RLS if the admin client is expected.

### 11. No CSRF Protection
**Severity:** MEDIUM

POST endpoints that modify state (credit deduction, puzzle creation, checkout) have no CSRF tokens. While the Same-Origin policy provides some protection, it's not sufficient against all attack vectors.

### 12. Weak Password Requirements
**File:** `src/app/signup/page.tsx:53`

Password minimum is only 6 characters. Modern standards recommend at least 8-12 characters.

### 13. Google Analytics Tag Hardcoded
**File:** `src/app/layout.tsx:51`

The GA tracking ID `G-TB8LQYPT6J` is hardcoded. While not a secret, it should ideally be in an environment variable for flexibility.

---

## LOW Issues

### 14. `dangerouslySetInnerHTML` Usage
**Files:** `MathlerGame.tsx:526`, `WordLadderGame.tsx:590`

Used for static CSS animations. Not exploitable since the content is hardcoded strings, but could be replaced with CSS modules or Tailwind `@keyframes` for better practice.

### 15. Chat Filter Bypass Potential
**File:** `src/lib/pixelville/chat-filter.ts`

The regex-based profanity filter is easily bypassed with Unicode lookalikes, zero-width characters, or creative spacing. This is inherent to regex-based filtering.

### 16. No Content Security Policy (CSP) Headers
**Severity:** LOW

No CSP headers are configured in `next.config.ts`. Adding CSP would help prevent XSS attacks.

### 17. No Security Headers
**Severity:** LOW

Missing headers: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`. These should be set in `next.config.ts`.

---

## Positive Findings

- Stripe webhook properly verifies signatures before processing
- Supabase auth uses `getUser()` (server-validated) rather than `getSession()` (JWT-only)
- Path traversal check exists on the frame file parameter
- Secrets (API keys, Stripe keys) are stored in environment variables, not hardcoded
- `.gitignore` properly excludes `.env.local` files
- `execFile` used instead of `exec` for external commands (no shell injection)
- Credit deduction uses a server-side RPC, preventing client manipulation
- Chat messages are filtered before sending

---

## Recommended Priority Fixes

1. **Add authentication to ALL admin API routes** (Critical)
2. **Fix the open redirect in auth callback** (Critical)
3. **Add authentication to generation endpoints** (High)
4. **Validate `sessionId` parameter for path traversal** (High)
5. **Create middleware.ts for centralized route protection** (High)
6. **Add rate limiting** (High)
7. **Add security headers in next.config.ts** (Medium)
8. **Add CSRF protection** (Medium)
