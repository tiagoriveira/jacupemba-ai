# HANDOFF DOCUMENT: Production-Ready Cleanup & Bug Fixes
## Jacupemba AI — Branch: `codigo-pronto-para-producao`

**Status**: Ready for Developer Handoff  
**Date**: February 2026  
**Criticality**: 5 Critical Bugs + 4 Code Cleanup Items + 10 Tech Debt Observations

---

## EXECUTIVE SUMMARY

This project is **feature-complete but NOT production-ready**. The codebase contains **5 critical bugs** that will cause silent failures or security issues in production, **4 significant code cleanup issues** that violate DRY and introduce confusion, and **10 medium-priority technical debt items** that will slow future development velocity.

**Estimated effort to production-ready**: 6-8 hours for an experienced developer (bugs + cleanup).

---

## ⚠️ CRITICAL BUGS (MUST FIX BEFORE DEPLOY)

### BUG #1: Disabled TypeScript & ESLint Validation
**File**: `next.config.mjs` (lines 6-8)  
**Severity**: CRITICAL — Code Quality Erosion  
**Risk**: Type errors, unused variables, and linting issues will silently accumulate in production builds.

```javascript
// CURRENT (WRONG):
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // ...
}
```

**What to do**:
1. Remove both `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` completely.
2. Run `npm run build` locally and fix any resulting TypeScript or ESLint errors.
3. If errors exist, they're likely in unused code (see Cleanup Issues below).

**Why this matters**: Without build-time validation, type errors and dead code ship to production undetected.

---

### BUG #2: Broken Favicon & Missing Icon Files
**File**: `app/layout.tsx` (line 29-30)  
**Severity**: CRITICAL — 404 Errors in Browser Console  
**Risk**: Silent 404s for favicon requests; metadata references non-existent files.

```typescript
// CURRENT (WRONG):
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
// These files don't exist in /public/
```

**What to do**:
1. Either:
   - **Option A**: Create the missing icon files (`/public/favicon.ico`, `/public/apple-touch-icon.png`), OR
   - **Option B**: Remove the favicon links from `<head>` entirely.
2. Remove the line: `<meta name="generator" content="v0.app" />` (not needed in production).
3. Verify no 404s appear in browser devtools Network tab when loading the app.

**Why this matters**: Broken icon references cause unnecessary HTTP 404s, polluting error logs and indicating a low-quality deployment.

---

### BUG #3: Wrong Model Name in AI Tool Configuration
**File**: `app/page.tsx` (line ~680-685, search for `analisarSentimento`)  
**Severity**: CRITICAL — AI Tool Failure  
**Risk**: The sentiment analysis tool will fail at runtime with invalid model error.

```typescript
// CURRENT (WRONG):
analisarSentimento: {
  description: "Analyze if a report shows a specific sentiment or emotion",
  parameters: z.object({...}),
  execute: async ({ texto }) => {
    // Uses hardcoded model "grok-4-1-fast-reasoning" 
    // This model doesn't exist; it conflicts with "grok-3-fast"
  }
}
```

**What to do**:
1. Search for all references to `"grok-4-1-fast-reasoning"` in `app/page.tsx`.
2. Replace all instances with `"grok-3-fast"` (matching the model used in the main chat tool).
3. Test the sentiment analysis in the UI (submit a report and verify no model errors occur).

**Why this matters**: Wrong model names cause runtime failures that silently degrade user experience.

---

### BUG #4: Duplicate Message Storage in Conversation Store
**File**: `app/page.tsx` (lines ~470-490, in the `handleSubmit` function)  
**Severity**: CRITICAL — Data Integrity Issue  
**Risk**: Messages are saved twice to the conversation store, causing duplicate entries in history/export.

```typescript
// CURRENT (PROBLEMATIC):
const handleSubmit = async (userMessage: string) => {
  // Line ~480: First save to store
  conversationStore.addMessage(userMessage, 'user');
  
  // Lines ~500-510: Add to local state
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  
  // Later (~530): API call happens, response comes back
  // But then response is ALSO saved to conversationStore + local state
  // However, BEFORE response, the original message might be added again
}
```

**Root cause**: The deduplication logic checking if message already exists in store is missing or weak.

**What to do**:
1. Locate the exact lines where messages are added to conversation store in `handleSubmit`.
2. Add a check: `if (!conversationStore.messages.some(m => m.content === userMessage && m.timestamp === Date.now()))` before each `addMessage()` call.
3. OR: Refactor to only save to store ONCE per message, either on send or on receive, not both.
4. Test by sending 5 messages, then exporting history — count should match sent messages exactly.

**Why this matters**: Duplicates inflate conversation history, break analytics, and degrade user trust in the app.

---

### BUG #5: Overly Permissive Image Remote Patterns
**File**: `next.config.mjs` (line ~15)  
**Severity**: HIGH — Security Risk (Open Redirect / Abuse Vector)  
**Risk**: `images.remotePatterns: [{ protocol: 'https', hostname: '**' }]` allows images from ANY domain, enabling SSRF or abuse.

```javascript
// CURRENT (WRONG):
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**' }  // TOO PERMISSIVE
  ]
}
```

**What to do**:
1. Identify which domains actually need to serve images (e.g., Supabase, Blob storage, etc.).
2. Replace wildcard with explicit domains:
   ```javascript
   images: {
     remotePatterns: [
       { protocol: 'https', hostname: 'res.cloudinary.com' },
       { protocol: 'https', hostname: '*.supabase.co' },
       // ... only add what's needed
     ]
   }
   ```
3. If using Stripe product images, add Stripe's domain.
4. Test image uploads/displays in vitrine and verify external domains are blocked.

**Why this matters**: Overly permissive patterns are a security vulnerability; they allow attackers to proxy images through your Next.js image optimization layer.

---

## 🧹 CODE CLEANUP (SHOULD FIX BEFORE DEPLOY)

### CLEANUP #1: Unused Constants in `app/page.tsx`
**File**: `app/page.tsx` (lines ~50-80)  
**Severity**: MEDIUM — Dead Code  
**Risk**: Increases bundle size; confuses maintainers about what's actually used.

```typescript
// CURRENT: These exist but are NEVER used:
const TRENDING_QUERIES = [...array...];  // Line ~55
const CATEGORY_LABELS = {...object...};  // Line ~65
```

**What to do**:
1. Search `app/page.tsx` for any usage of `TRENDING_QUERIES` and `CATEGORY_LABELS` (grep or Ctrl+F).
2. If no references exist, delete both constant declarations.
3. If they're used, identify where and document it; if it's legacy, delete.

**Why this matters**: Dead constants add cognitive load and increase bundle size unnecessarily.

---

### CLEANUP #2: Image Upload Logic in Report Modal (Never Sent)
**File**: `app/page.tsx` (search for `reportImage` or `ModalReport`)  
**Severity**: MEDIUM — Misleading UI / Incomplete Feature  
**Risk**: Users see image upload field but images are never sent to backend; creates false expectation.

**Current state**:
- The report modal has image upload UI (file input, preview).
- Images are stored in local state (`reportImage` state var).
- But the API endpoint `/api/moderate/route.ts` does NOT accept images; it only takes `content` field.
- Result: Users upload images thinking they'll be included, but they're silently dropped.

**What to do**:
1. Either:
   - **Option A (Recommended)**: Remove all image-related code from the report modal (refs, state vars, handlers, UI).
   - **Option B**: Implement full image support in the backend (add image field to reports table, handle upload, etc.).
2. If removing: Delete `reportImage` state var, `imageRef`, `handleImageSelect()`, the `<input type="file">` element, and preview div.
3. Test: Submit a report and verify the form still works without image UI.

**Why this matters**: Incomplete features frustrate users and indicate low code quality.

---

### CLEANUP #3: Duplicate React Imports
**File**: `app/page.tsx` (top of file)  
**Severity**: LOW — Code Style  
**Risk**: None functionally, but violates import organization best practices.

```typescript
// CURRENT: React imported multiple times
import React from 'react';
import { useEffect, useState } from 'react';
import React, { useRef, useCallback } from 'react';  // React imported again!
```

**What to do**:
1. Consolidate all React imports into ONE statement at the top:
   ```typescript
   import React, { useState, useEffect, useRef, useCallback } from 'react';
   ```
2. Remove duplicate `import React` lines.
3. Organize other imports alphabetically (external deps, then local).

**Why this matters**: Consistent import patterns improve readability and prevent accidental re-imports.

---

### CLEANUP #4: Stale Keywords in History Analyzer
**File**: `lib/historyAnalyzer.ts` (search for keywords array)  
**Severity**: MEDIUM — Feature Inconsistency  
**Risk**: History analyzer suggests service keywords (electrician, mechanic) that don't exist; contradicts agent config.

```typescript
// CURRENT: Keywords include services NOT in the agent's tool set
const SUGGESTION_KEYWORDS = [
  'eletricista',   // ← Agent doesn't have electrician tool
  'mecânico',      // ← Agent doesn't have mechanic tool
  'relato',        // ✓ Valid
  'vitrine',       // ✓ Valid
  // ...
];
```

**What to do**:
1. Read `app/page.tsx` and identify ALL tools defined in the agent's toolset (search for `tools: {`).
2. Update `SUGGESTION_KEYWORDS` in `lib/historyAnalyzer.ts` to ONLY include keywords matching actual tools.
3. Remove any keywords for removed services.

**Why this matters**: Stale suggestions mislead users; they click on chips expecting functionality that doesn't exist.

---

## 🚀 DEPLOYMENT CHECKLIST

Execute in this exact order:

### Pre-Deploy (Local)
- [ ] **Step 1**: Remove `ignoreBuildErrors` and `ignoreDuringBuilds` from `next.config.mjs`.
- [ ] **Step 2**: Run `npm run build` and fix any TypeScript or ESLint errors.
- [ ] **Step 3**: Fix favicon references or remove them from `app/layout.tsx`.
- [ ] **Step 4**: Replace `"grok-4-1-fast-reasoning"` with `"grok-3-fast"` in `app/page.tsx`.
- [ ] **Step 5**: Fix image remote patterns in `next.config.mjs` (explicit domains only).
- [ ] **Step 6**: Clean up unused constants and dead code.
- [ ] **Step 7**: Run `npm run build` again — should pass cleanly.
- [ ] **Step 8**: Run `npm run dev` locally and test core flows (chat, report, vitrine, stripe checkout).

### Environment & Secrets
- [ ] **Step 9**: Verify all `.env.local` variables are defined in Vercel project settings (Settings → Environment Variables).
  - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GROK_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] **Step 10**: Test Stripe webhook signing — POST to `/api/stripe/webhook` with mock payload and verify signature validation works.

### Database & Third-Party
- [ ] **Step 11**: Verify Supabase RLS policies are in production mode (no debug/logging leaks).
- [ ] **Step 12**: Run database migration scripts (if any pending) against production Supabase project.
- [ ] **Step 13**: Verify Stripe product IDs match production environment (not sandbox).

### Post-Deploy (Production)
- [ ] **Step 14**: Check browser console for 404s, CORS errors, or type errors.
- [ ] **Step 15**: Test full user flow: auth → chat → report → vitrine → payment checkout.
- [ ] **Step 16**: Monitor error logs for 24 hours (Vercel Analytics or Sentry if configured).
- [ ] **Step 17**: Verify rate limiting is working (test rapid API requests; should 429 after limit).

---

## 📋 TECHNICAL DEBT & FUTURE WORK (Priority Order)

### T1: Implement Rate Limiting (URGENT)
**Impact**: High — Financial Risk (API cost explosion)  
**Current State**: No rate limiting on chat API endpoint.  
**Action**: Implement using Upstash Redis or in-memory store with fingerprint-based limits (e.g., 10 messages/minute per device).

### T2: Add Error Boundary Component
**Impact**: Medium — UX & Observability  
**Current State**: Unhandled errors crash entire app.  
**Action**: Wrap page in error boundary; surface to user gracefully.

### T3: Implement Structured Logging
**Impact**: Medium — Operations  
**Current State**: `console.log()` scattered throughout; no centralized logging.  
**Action**: Use pino or Winston for structured logs; ship to external service (Sentry, LogRocket).

### T4: Add Type Safety to Database Queries
**Impact**: Medium — Code Quality  
**Current State**: Supabase queries use `.any()` casts instead of proper types.  
**Action**: Generate TypeScript types from Supabase schema; use Zod for runtime validation.

### T5: Consolidate Stripe Configuration
**Impact**: Low — DRY Principle  
**Current State**: Stripe client instantiated in multiple files without shared config.  
**Action**: Create `lib/stripe-client.ts` singleton; import everywhere.

### T6: Implement Request Deduplication Cache
**Impact**: Medium — Performance  
**Current State**: Identical API requests can be made simultaneously (duplicate work).  
**Action**: Add SWR or React Query with deduplication strategy.

### T7: Add API Response Validation Schema
**Impact**: Medium — Data Integrity  
**Current State**: API responses parsed without schema validation.  
**Action**: Define Zod schemas for each API route; validate response before returning.

### T8: Implement Session Timeout & Refresh Logic
**Impact**: High — Security  
**Current State**: Sessions don't timeout; no refresh token rotation.  
**Action**: Add session expiry checks; implement refresh token rotation on `/api/auth/refresh`.

### T9: Add Integration Tests for Payment Flow
**Impact**: High — Business Critical  
**Current State**: No automated tests for Stripe checkout → webhook → database flow.  
**Action**: Write integration tests using Stripe test API keys; verify end-to-end payment processing.

### T10: Implement Content Delivery Optimization
**Impact**: Low — Performance  
**Current State**: Images not optimized; no caching headers on static assets.  
**Action**: Enable image optimization in Next.js config; set cache headers for static files (1 year for hashed files).

---

## 🧭 FILES INVOLVED IN FIXES

| File | Changes | Complexity |
|------|---------|-----------|
| `next.config.mjs` | Remove ignore flags, fix images pattern | Low |
| `app/layout.tsx` | Remove broken icons, meta tag | Low |
| `app/page.tsx` | Fix model name, remove image upload, clean imports, dedupe messages | Medium |
| `lib/historyAnalyzer.ts` | Update keyword suggestions | Low |
| `lib/moderacao-triagem.ts` | (If needed) Verify no stale refs | Low |

---

## 📝 SIGN-OFF

This handoff document is **final and comprehensive**. No changes to requirements are expected.

**Developer**: Implement in order; commit each fix with a descriptive message (e.g., `fix: remove TS ignore flags from next.config`).

**QA**: Verify each fix matches the checklist above; run full regression test after all fixes applied.

**DevOps**: Deploy using standard CI/CD process; monitor error rates for 24h post-deploy.

---

## ❓ QUESTIONS?

Refer to the **USERFLOW.md** for system architecture and user flow context.  
Refer to the **README.md** for setup and local development instructions.

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Ready for Development
