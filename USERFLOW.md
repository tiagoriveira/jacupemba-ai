# USER FLOW DOCUMENTATION
## Jacupemba AI — Complete System Journey

**Language**: English (Natural Language)  
**Audience**: Product, Design, QA, Engineering  
**Last Updated**: February 2026  
**Status**: Production Reference

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Core Identity Model](#core-identity-model)
3. [User Flows (9 Main Paths)](#user-flows)
4. [Route Map](#route-map)
5. [Error States & Edge Cases](#error-states--edge-cases)
6. [Known UX Gaps & Limitations](#known-ux-gaps--limitations)

---

## SYSTEM OVERVIEW

**Jacupemba AI** is a multi-role platform for:
- **End Users**: Chat with an AI agent to get business recommendations, report bad behavior
- **Business Owners**: List their business in a free or paid "vitrine" (showcase)
- **Administrators**: Moderate reports and manage platform content

The system uses a **hybrid identity model**:
- **Fingerprinted Sessions**: Anonymous browsing (no auth required)
- **Authenticated Sessions**: For business owners and admins (Supabase auth)
- **Conversation Persistence**: Local storage + server-side conversation store (Supabase)

---

## CORE IDENTITY MODEL

### Identity Types

| Type | Auth Required | Tracking | Use Cases | Data Persists |
|------|---|---|---|---|
| **Anonymous Visitor** | No | Device fingerprint | Browse chat, create reports, view vitrine | 24-72 hours |
| **Authenticated User** | Yes (email/password) | Supabase user ID | Business owner, admin dashboard | Indefinite |
| **Business Owner** | Yes | Supabase user ID + business_id | Create/manage vitrine listings, view analytics | Indefinite |
| **Admin** | Yes | Supabase user ID + admin flag | Moderate reports, view admin dashboard | Indefinite |

### Session & Cookie Model

```
┌─────────────────────────────────────┐
│ Browser First Load                  │
└─────────────────────────────────────┘
        │
        ↓
┌─────────────────────────────────────┐
│ Generate Device Fingerprint         │
│ (navigator.userAgent +              │
│  screen.resolution + timezone)      │
│ Store in localStorage               │
└─────────────────────────────────────┘
        │
        ↓
┌─────────────────────────────────────┐
│ Check if fingerprint in             │
│ conversation_store table            │
└─────────────────────────────────────┘
        │
    ┌───┴───────────────┐
    │                   │
  YES (returning user) NO (new user)
    │                   │
    ↓                   ↓
Load previous     Start fresh
conversations     session
    │                   │
    └───────┬───────────┘
            │
    ┌───────↓──────────┐
    │ User can now:    │
    │ • Chat          │
    │ • Report        │
    │ • Browse vitrine│
    │ • Buy vitrine   │
    └──────────────────┘
```

**Fingerprint Expiry**: 72 hours; after expiry, user is treated as new.

---

## USER FLOWS

### FLOW 1: New Visitor (Anonymous Browse + Chat)

**Trigger**: User lands on `https://app.example.com/` without any prior session  
**Duration**: 10 minutes typical

```
┌─ User lands on homepage
└─ App checks localStorage for fingerprint
   └─ None found → Generate new fingerprint
      └─ Call /api/fingerprint (returns fingerprint ID)
         └─ Store fingerprint in localStorage
            └─ Load empty conversation
               └─ Render chat UI

┌─ User types question (e.g., "onde achar eletricista barato?")
└─ Click send
   └─ Message added to local state
      └─ Call /api/chat with fingerprint + message
         └─ Backend saves conversation with fingerprint
            └─ AI agent processes via Grok model
               └─ Agent searches using /api/semantic-search
                  └─ Finds matching business recommendations
                     └─ Stream response back to client
                        └─ Display in chat bubble

┌─ User sees response (e.g., "Here are 3 electricians...")
└─ User may:
   • Ask follow-up question → repeat chat flow
   • Click on business card → view vitrine details
   • Report inappropriate response → open report modal
   • Leave app → session persists for 72h via fingerprint
```

**Key Points**:
- No authentication required
- Conversation saved to `conversation_store` table with fingerprint
- Reports linked to fingerprint (no user_id)
- Stripe checkout skipped for free vitrine listings

---

### FLOW 2: Returning Anonymous Visitor

**Trigger**: User visits app within 72 hours of previous session  
**Duration**: 5 minutes typical

```
┌─ User lands on homepage
└─ App checks localStorage for fingerprint
   └─ Found → fingerprint = "xyz789"
      └─ Call /api/semantic-search with fingerprint
         └─ Retrieve previous conversations
            └─ Hydrate chat UI with history
               └─ User can see previous messages

┌─ Optionally: User clicks "New Conversation"
└─ Clear local state, start fresh
   └─ BUT: Old conversation still in database (fingerprint reference remains)
```

**Key Points**:
- Conversation history loaded automatically
- User can start new chat without clearing history (new URL param or state)
- No login required; pure fingerprint-based persistence

---

### FLOW 3: Submit Report (Anonymous or Authenticated)

**Trigger**: User sees inappropriate message and clicks report icon  
**Duration**: 2 minutes typical

```
┌─ User sees bad message in chat
└─ Click "Report" icon/button
   └─ Modal opens with form:
      • Reason dropdown (inappropriate, spam, other)
      • Text field for explanation
      • [OLD/UNUSED] Image upload field (currently broken)
   └─ User fills form
      └─ Click "Submit Report"
         └─ Call /api/moderate
            ├─ Save report to `reports` table
            │  ├─ content: (text explanation)
            │  ├─ reason: (dropdown selection)
            │  ├─ conversation_id: (linked to conversation)
            │  ├─ fingerprint: (if anonymous)
            │  ├─ user_id: (if authenticated)
            │  └─ status: "pending" (awaiting admin review)
            │
            └─ Run moderation check:
               ├─ Call Grok moderation tool
               ├─ Tool classifies severity (low/medium/high)
               ├─ If high severity:
               │  └─ Flag report for immediate admin review
               │
               └─ Return success to user
                  └─ Toast: "Report submitted successfully"
                     └─ Modal closes

┌─ Admin (later) reviews report
└─ See report in /admin dashboard
   └─ Can approve, reject, or mute user
```

**Key Points**:
- No auth required; fingerprint ties report to conversation
- Image field in modal is NOT functional (cleanup item #2 in HANDOFF.md)
- Moderacao-triagem AI tool classifies severity automatically
- Reports visible only to admin role

---

### FLOW 4: Feed of Reports (Admin Dashboard)

**Trigger**: Admin user logs in and navigates to `/admin`  
**Duration**: Variable (admin review task)

```
┌─ Admin logs in with email/password
└─ Supabase auth validates credentials
   └─ Session stored in HTTP-only cookie
      └─ Redirect to /admin dashboard
         └─ Call /api/admin/reports (authenticated)
            └─ Query `reports` table (RLS filters to admin-only rows)
               └─ Return paginated list:
                  • Report ID, timestamp, reason
                  • Conversation snippet (first 100 chars)
                  • Severity badge (low/medium/high)
                  • Action buttons (approve, reject, mute)

┌─ Admin reviews report
└─ Clicks "View Conversation" 
   └─ Full conversation history displayed in modal
      └─ Admin can see:
         • All messages in the conversation
         • Which message was flagged
         • User fingerprint (if anonymous) or email (if authenticated)

┌─ Admin decides action
└─ Clicks button:
   • "Approve" (mark as legitimate)
     └─ Update report.status = "approved"
        └─ No impact on conversation
   • "Reject" (actually inappropriate)
     └─ Update report.status = "rejected"
        └─ Call /api/admin/delete-content (optional)
           └─ Delete flagged message or entire conversation
   • "Mute User"
     └─ Add fingerprint/user_id to muted_users table
        └─ User can still view app, but messages don't trigger sentiment analysis

┌─ Action confirmed
└─ Report status updates in dashboard
   └─ Notification sent (if admin email configured)
```

**Key Points**:
- Only users with `role = 'admin'` in Supabase `users` table can access
- RLS policies enforce admin-only access
- Conversation linked to report via `conversation_id`
- Muting blocks user from interacting further (optional feature)

---

### FLOW 5: Browse Vitrine (Discover Businesses)

**Trigger**: User clicks "Vitrine" link or navigates to `/vitrine`  
**Duration**: 5–15 minutes (browsing)

```
┌─ User navigates to /vitrine
└─ Call /api/vitrine/list
   └─ Query `vitrines` table WHERE status = 'active'
      └─ Return paginated grid:
         • Business name, description, image, rating
         • Category badge (shop, service, etc.)
         • "See Details" button

┌─ VitrineGrid component renders cards
└─ Each card shows:
   • Business photo (Supabase storage or Stripe product image)
   • Name & description (first 80 chars)
   • Rating/stars (from separate ratings table, if exists)
   • "View Details" button
   • Price tag (if paid tier; otherwise "Free")

┌─ User hovers over card or clicks "View Details"
└─ Navigate to `/vitrine/[id]` page
   └─ Call /api/vitrine/get?id=xyz
      └─ Return full vitrine:
         • Full description
         • Gallery images
         • Contact info (email, phone if provided)
         • Reviews/ratings (if feature implemented)
         • "Call to Action" button:
           - For free vitrines: "Contact Business" (links to email/phone)
           - For paid vitrines: "Buy Premium Access" (Stripe checkout)

┌─ User clicks "Contact Business"
└─ Opens email client or copies phone number
   └─ User can directly contact business owner

┌─ User clicks "Buy Premium Access" (paid vitrine)
└─ Redirect to Stripe checkout
   └─ [See FLOW 7 below]
```

**Key Points**:
- Anyone can browse vitrine (no auth required)
- Vitrine list paginated (default: 20 per page)
- Images served via Supabase storage or Stripe (see security note in HANDOFF.md)
- Filtering/search NOT fully implemented yet (future work)

---

### FLOW 6: Create Free Vitrine (Business Owner Onboarding)

**Trigger**: Unauthenticated user clicks "List Your Business" or navigates to `/vitrine/criar`  
**Duration**: 5–10 minutes

```
┌─ User (business owner) on /vitrine/criar page
└─ NOT authenticated yet; form is visible as "preview"
   └─ Form fields:
      • Business name
      • Category (dropdown)
      • Description (textarea)
      • Email
      • Phone
      • Website URL (optional)
      • Images (file upload)

┌─ User fills form
└─ Clicks "Create Vitrine"
   └─ Form validation:
      • Required fields checked
      • Email format validated
      • Images max 5MB each
      └─ If errors: Toast "Please fill in all fields"
         └─ Highlight invalid fields

┌─ Form valid
└─ Show prompt: "Create account to list your business"
   └─ Two options:
      • "Sign Up" (email/password)
      • "Continue as Guest" (email only, no account)

┌─ User clicks "Sign Up"
└─ Modal opens with signup form:
   • Email
   • Password (2x confirm)
   • Business name (pre-filled)
   └─ Submit
      └─ Call /api/auth/signup
         └─ Supabase creates user
         └─ Supabase sends confirmation email
         └─ User redirected to verification page
            └─ "Check your email to confirm"
            └─ User clicks link in email
               └─ Email verified, account active

┌─ User authenticated
└─ Call /api/vitrine/create
   ├─ Save vitrine to `vitrines` table:
   │  ├─ name, category, description, email, phone, website
   │  ├─ owner_id: (Supabase user ID)
   │  ├─ status: "active"
   │  ├─ tier: "free"
   │  ├─ created_at: timestamp
   │  └─ images: [array of URLs from storage]
   │
   └─ Upload images to Supabase storage
      └─ Return vitrine ID
         └─ Redirect to /vitrine/[id]
            └─ Show success: "Your business is live!"

┌─ Business now visible on /vitrine grid
└─ Anyone can see and contact via email/phone
```

**Key Points**:
- No payment required for free tier
- Email verification needed to create vitrine
- Multiple images uploadable (stored in Supabase storage)
- Free vitrines appear alongside paid vitrines in browse feed

---

### FLOW 7: Create Paid Vitrine + Stripe Checkout

**Trigger**: Business owner upgrades free vitrine OR creates new paid vitrine  
**Duration**: 2–5 minutes (payment)

```
┌─ User (authenticated) on vitrine form
└─ Selects "Paid Tier" option
   └─ Form shows additional fields:
      • Highlighted features (badge "Premium")
      • Price selector (e.g., $9.99/month, $24.99/3-months)
      • Billing period selection

┌─ User fills form and clicks "Create Paid Vitrine"
└─ Validation passes
   └─ Call /api/vitrine/create with tier: "premium"
      ├─ Save vitrine with status: "payment_pending"
      ├─ Store Stripe price ID with vitrine
      └─ Return Stripe checkout session URL
         └─ Redirect to Stripe checkout
            └─ User sees:
               • Business details summary
               • Pricing & billing period
               • Total amount
               • Payment method input (card, Apple Pay, etc.)

┌─ User enters payment info
└─ Clicks "Pay $X.XX"
   └─ Stripe processes payment
      ├─ If success:
      │  └─ Stripe sends webhook to /api/stripe/webhook
      │     ├─ Event type: "charge.succeeded" or "invoice.paid"
      │     ├─ Webhook handler validates Stripe signature (CRITICAL: see HANDOFF.md)
      │     ├─ Update vitrine.status = "active"
      │     ├─ Create subscription record in `subscriptions` table
      │     │  ├─ user_id, vitrine_id, stripe_subscription_id
      │     │  ├─ start_date, end_date (based on billing period)
      │     │  └─ status: "active"
      │     └─ Send confirmation email to user
      │
      └─ If declined:
         └─ Stripe returns error to checkout
            └─ Show message: "Card declined. Try another payment method."
               └─ User returns to checkout to retry

┌─ Payment successful
└─ Redirect to /vitrine/[id]?status=success
   └─ Show success banner: "Your premium listing is now live!"
   └─ Business now visible on vitrine grid with "Premium" badge
   └─ Owner can manage via /painel-lojista

┌─ Subscription active
└─ Next renewal date: [end_date] (e.g., 30 days)
   └─ Stripe automatically renews on renewal date
      └─ If renewal fails (card expired):
         └─ Email sent to owner: "Payment failed. Update your payment method."
         └─ Vitrine status changes to "suspended" until payment recovered
```

**Key Points**:
- Free vitrine can be upgraded to paid (transition: tier "free" → "premium")
- Stripe webhook CRITICAL — validates signature to prevent spoofing (HANDOFF.md BUG #5)
- Subscription stored separately for renewal tracking
- Automatic renewal configured in Stripe (recurring charge)
- Suspended vitrines not visible on /vitrine grid

---

### FLOW 8: Business Owner Painel (Manage Vitrine)

**Trigger**: Business owner logs in and navigates to `/painel-lojista`  
**Duration**: 5–30 minutes (management task)

```
┌─ Owner authenticated (Supabase user)
└─ Navigate to /painel-lojista
   └─ Check auth (must be logged in)
      └─ Call /api/painel-lojista/my-vitrines
         └─ Query `vitrines` WHERE owner_id = current_user_id
            └─ Return list of owner's vitrines:
               • Vitrine name, status (active/suspended/draft)
               • Views count (if analytics table exists)
               • Tier (free/premium)
               • Created date
               • Action buttons: (Edit, Delete, View, Analytics)

┌─ Owner clicks "Edit"
└─ Open edit modal/page
   └─ Pre-populate form with:
      • Business name
      • Category
      • Description
      • Images
      • Contact info
   └─ Owner modifies fields
      └─ Click "Save Changes"
         └─ Call /api/vitrine/update
            ├─ Validate changes
            ├─ Update `vitrines` table row
            ├─ Update images in storage if changed
            └─ Return success
               └─ Show toast: "Vitrine updated!"

┌─ Owner clicks "View"
└─ Navigate to /vitrine/[id] (public view)
   └─ See how customers see the vitrine

┌─ Owner clicks "Delete"
└─ Show confirmation modal: "This cannot be undone."
   └─ Owner confirms
      └─ Call /api/vitrine/delete
         ├─ Soft delete or hard delete (depends on design choice):
         │  • Soft: status = "deleted", keep data for analytics
         │  • Hard: remove row completely
         ├─ Delete associated images from storage
         └─ Redirect to painel-lojista
            └─ Vitrine removed from owner's list

┌─ Owner clicks "Analytics" (if implemented)
└─ Show chart/stats:
   • Views: 245
   • Clicks: 18
   • Conversion rate: 7.3%
   • Top referrer: Chat recommendations
```

**Key Points**:
- Only owner can see/edit their own vitrines (RLS enforced)
- Soft delete recommended to preserve analytics history
- Images deleted from storage when vitrine deleted
- Analytics feature partially implemented (views counted, but no dashboard yet)

---

### FLOW 9: Admin Moderation & Configuration

**Trigger**: Admin user logs in and navigates to `/admin`  
**Duration**: 20+ minutes (ongoing monitoring)

```
┌─ Admin (role: "admin" in Supabase) logs in
└─ Navigate to /admin
   └─ AdminDashboard component renders tabs:
      • Reports (count badge showing pending)
      • Users (if user management needed)
      • Analytics
      • Settings

┌─ Admin clicks "Reports" tab
└─ Load report feed
   └─ [See FLOW 4 for detailed report review]

┌─ Admin clicks "Analytics" tab
└─ Dashboard shows:
   • Total conversations: 1,240
   • Total reports submitted: 34
   • Reports resolved: 31
   • Pending reports: 3
   • Most common report reason: "Inappropriate content" (18)
   • Most active business category: "Electrician" (245 listings)

┌─ Admin clicks "Settings"
└─ Configure:
   • Moderation rules (sensitivity level for auto-flagging)
   • Rate limits (messages/min, reports/day)
   • Blocked keywords (if any)
   • Email notifications (on/off for new reports)
   └─ Click "Save Settings"
      └─ Store in admin_config table or Supabase metadata

┌─ Admin monitors performance
└─ Can see real-time metrics:
   • API response times
   • Error rates
   • Active users
   • Chat model latency (Grok)
```

**Key Points**:
- Admin dashboard NOT fully built yet (MVP status)
- Report moderation is core feature (fully implemented)
- Analytics dashboard exists but minimal data collection
- Settings page skeleton exists; not all configs functional

---

## ROUTE MAP

| Route | Public | Auth | Method | Purpose |
|-------|--------|------|--------|---------|
| `/` | ✓ | — | GET | Homepage; chat interface |
| `/vitrine` | ✓ | — | GET | Browse businesses |
| `/vitrine/[id]` | ✓ | — | GET | Vitrine details |
| `/vitrine/criar` | ✓ | ✓ (optional) | GET/POST | Create vitrine form |
| `/painel-lojista` | — | ✓ | GET | Owner dashboard |
| `/admin` | — | ✓ (admin only) | GET | Admin moderation |
| `/historico` | — | ✓ (optional) | GET | Chat history (if user authenticated) |
| `/relatos` | — | ✓ (admin only) | GET | Report feed (admin view) |
| `/not-found` | ✓ | — | GET | 404 page |

| API Route | Auth | Purpose |
|-----------|------|---------|
| `/api/chat` | fingerprint | Stream chat response from Grok AI |
| `/api/moderate` | fingerprint | Submit report of bad content |
| `/api/semantic-search` | fingerprint | Search for business recommendations |
| `/api/vitrine/list` | — | List all active vitrines |
| `/api/vitrine/create` | ✓ user | Create new vitrine |
| `/api/vitrine/update` | ✓ user | Edit vitrine |
| `/api/vitrine/delete` | ✓ user | Delete vitrine |
| `/api/stripe/create-checkout` | ✓ user | Generate Stripe checkout session |
| `/api/stripe/webhook` | — (signature validated) | Receive Stripe events |
| `/api/admin/reports` | ✓ admin | Fetch reports for moderation |
| `/api/admin/update-report` | ✓ admin | Approve/reject report |
| `/api/upload` | ✓ user | Upload image to Supabase storage |
| `/api/fingerprint` | — | Generate/validate device fingerprint |

---

## ERROR STATES & EDGE CASES

### Chat API Errors

| Error | Cause | User Experience |
|-------|-------|------------------|
| Model not available | Grok API down | Toast: "AI service temporarily unavailable. Try again in a few moments." |
| Rate limited | 10+ messages/min from same fingerprint | Toast: "Please wait a moment before sending another message." |
| Empty message | User sends empty string | Toast: "Please type a message." |
| Network timeout | Request takes >30s | Toast: "Connection lost. Check your internet." |
| Invalid fingerprint | Fingerprint tampered/expired | Regenerate fingerprint; start fresh session |

### Vitrine Creation Errors

| Error | Cause | User Experience |
|-------|-------|------------------|
| Image too large | File > 5MB | Toast: "Images must be smaller than 5MB." |
| Email already registered | Email exists in `users` table | Toast: "Email already in use. Login instead." |
| Payment declined | Card declined by Stripe | Toast: "Payment failed. Try another card." |
| Storage quota exceeded | Supabase storage full | Toast: "Unable to upload image. Contact support." |

### Report Submission Errors

| Error | Cause | User Experience |
|-------|-------|------------------|
| Missing reason | Dropdown not selected | Highlight field; show: "Please select a reason." |
| Text too short | Explanation < 10 chars | Toast: "Please provide more detail." |
| Duplicate report | Same conversation reported twice | Toast: "You've already reported this conversation." |

### Admin Moderation Errors

| Error | Cause | User Experience |
|-------|-------|------------------|
| No permission | Non-admin user accessing /admin | Redirect to `/` with toast: "Access denied." |
| Report not found | Report ID invalid | Show 404: "Report not found." |
| Failed to delete | Database error during soft delete | Toast: "Action failed. Try again." |

### Payment/Stripe Errors

| Error | Cause | User Experience |
|-------|-------|------------------|
| Webhook signature invalid | Tampering attempted or clock skew | Log error; NO charge applied (safety-first) |
| Subscription creation failed | DB error after Stripe charge | Manual reconciliation needed; user notified |
| Stripe API down | Rare outage | Checkout disabled; show: "Payment temporarily unavailable." |

---

## KNOWN UX GAPS & LIMITATIONS

### Gap 1: Image Upload in Report Modal (CRITICAL)
**Issue**: Report modal has image upload UI, but images are never sent to backend.  
**Impact**: Users upload images thinking they'll be reviewed; they're silently discarded.  
**Fix**: Remove image UI or implement full backend support (see HANDOFF.md CLEANUP #2).

### Gap 2: No Search on Vitrine Grid
**Issue**: Users can't filter businesses by name, category, or location.  
**Impact**: Hard to find specific business type in large vitrine list.  
**Workaround**: Use chat agent to ask AI ("Find plumbers near me") which triggers semantic search.  
**Priority**: Medium (add filtering UI and API in next sprint).

### Gap 3: Rate Limiting Not Implemented
**Issue**: No protection against spam or API abuse.  
**Impact**: Single user could make 1000s of chat requests, inflating API costs dramatically.  
**Fix**: Implement rate limiting on chat API (see HANDOFF.md T1).

### Gap 4: No User Ban/Suspension System
**Issue**: Muted users can still create new vitrines under different email.  
**Impact**: Banned spammers can circumvent restrictions.  
**Fix**: Add account suspension (not just mute) with prevention of email reuse.

### Gap 5: Conversation History Not Exportable
**Issue**: Users can't download chat history as PDF or JSON.  
**Impact**: Data lock-in; users can't back up conversations.  
**Fix**: Add export button to chat UI; generate downloadable file.

### Gap 6: No Analytics for Owners
**Issue**: Business owners can't see how many views/clicks their vitrine got.  
**Impact**: No way to measure ROI on premium tier.  
**Fix**: Implement view tracking and dashboard (partially done; see FLOW 8).

### Gap 7: No Notification System
**Issue**: Owners don't know when their vitrine is viewed or contacted.  
**Impact**: Missed business opportunities.  
**Fix**: Add email notifications (optional feature) or in-app notification bell.

### Gap 8: Sentiment Analysis Tool Sometimes Fails
**Issue**: Tool configured with wrong model name (`grok-4-1-fast-reasoning` doesn't exist).  
**Impact**: Sentiment analysis feature breaks silently.  
**Fix**: Update to `grok-3-fast` (see HANDOFF.md BUG #3).

### Gap 9: No Accessibility Features
**Issue**: Site not tested for screen readers, keyboard navigation, or contrast ratios.  
**Impact**: Disabled users can't use platform.  
**Fix**: Run accessibility audit; add ARIA labels and keyboard support.

### Gap 10: Mobile Responsiveness Limited
**Issue**: Some pages not optimized for mobile (e.g., painel-lojista might be cramped).  
**Impact**: Mobile users have poor experience; may abandon.  
**Fix**: Test on mobile; adjust layout for small screens.

---

## DATA FLOW DIAGRAM

```
┌──────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ localStorage: { fingerprint: "xyz789" }                │  │
│  │ sessionStorage: { currentConversationId: "abc123" }   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP / WebSocket
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Route Handlers (/api/*)                              │   │
│  │ • /api/chat → Calls Grok AI                         │   │
│  │ • /api/moderate → Saves report to Supabase         │   │
│  │ • /api/vitrine/* → CRUD operations on vitrines     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ↓                ↓                ↓
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│   SUPABASE DB   │ │  GROK API    │ │ STRIPE API   │
│ ┌─────────────┐ │ │              │ │              │
│ │ users       │ │ │ (LLM model)  │ │ (Payments)   │
│ │ vitrines    │ │ │              │ │              │
│ │ reports     │ │ └──────────────┘ │              │
│ │ relatos     │ │                  │              │
│ │ conversation│ │                  │              │
│ │ _store      │ │                  │              │
│ │ subscriptions          │              │
│ └─────────────┘ │                  └──────────────┘
└─────────────────┘
```

---

## SESSION EXPIRY & CLEANUP SCHEDULE

| Item | Expiry | Action |
|------|--------|--------|
| Anonymous fingerprint | 72 hours | Automatic cleanup job |
| Free vitrine | Never | Until owner deletes |
| Paid vitrine subscription | Billing period | Auto-renewal or suspension |
| Admin report | Never | Until manually resolved |
| Muted user fingerprint | 30 days (configurable) | Auto-unmute after period |

---

## TESTING CHECKLIST

- [ ] New user flow: Land → Chat → View vitrine → Submit report
- [ ] Returning user: Previous conversations load, messages deduplicated
- [ ] Create free vitrine: Email signup → Form fill → Appears in grid
- [ ] Create paid vitrine: Stripe checkout → Webhook fires → Vitrine goes active
- [ ] Admin review reports: Load dashboard → View conversation → Approve/reject
- [ ] Image upload: Upload vitrine images → Verify in Supabase storage
- [ ] Rate limiting: Send 15 messages in rapid succession → 429 error on excess
- [ ] Mobile responsiveness: Test on iPhone, Android, tablet
- [ ] Error states: Disconnect internet during chat → Show timeout error

---

## SUPPORT RESOURCES

- **Product Spec**: Refer to `README.md` for project overview
- **Deployment Guide**: See `HANDOFF.md` for bug fixes and deploy checklist
- **API Documentation**: See individual route.ts files in `/app/api/`
- **Database Schema**: Query `information_schema.tables` in Supabase; also see schema migration files

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Status**: Production Reference Document
