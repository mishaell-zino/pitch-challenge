# Technical Documentation: Permit Help Assistant

## Executive Summary

The Permit Help Assistant is a multilingual, accessible citizen service platform built with Next.js 16 that helps citizens interact with city building permit services. The system provides a conversational interface for checking application status, applying for permits, and escalating issues to caseworkers with full context preservation.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Core Features](#core-features)
4. [Data Models](#data-models)
5. [Application Structure](#application-structure)
6. [API Endpoints](#api-endpoints)
7. [Internationalization (i18n)](#internationalization-i18n)
8. [State Management](#state-management)
9. [User Flows](#user-flows)
10. [Accessibility Features](#accessibility-features)
11. [Component Architecture](#component-architecture)
12. [Deployment & Configuration](#deployment--configuration)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  Citizen Interface   │    │  Caseworker Dashboard    │  │
│  │  (Multilingual Chat) │    │  (Escalation Queue)      │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │   API Routes         │    │   Server Components      │  │
│  │   /api/applications  │    │   Page Rendering         │  │
│  │   /api/escalations   │    │                          │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (In-Memory)                    │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │  Applications Store  │    │  Escalations Store       │  │
│  │  (case-store.ts)     │    │  (case-store.ts)         │  │
│  └──────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Accessibility First**: WCAG 2.1 AA compliant with screen reader support, keyboard navigation, and text scaling
2. **Multilingual by Default**: Full support for English, Spanish, and Arabic (including RTL layout)
3. **Context Preservation**: Complete conversation history passed to caseworkers to eliminate citizen repetition
4. **Progressive Enhancement**: Works without JavaScript for basic functionality
5. **Mobile-First Design**: Responsive layout optimized for mobile devices

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.2.9 (React 19.2.7)
- **Language**: TypeScript 5.7.3
- **Styling**: Tailwind CSS 4.2.0
- **UI Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React 1.16.0
- **Data Fetching**: SWR 2.4.1 (for real-time updates)
- **Fonts**: Geist Sans & Geist Mono

### Backend
- **Runtime**: Next.js API Routes (Node.js)
- **Data Storage**: In-memory store (POC - would be replaced with database)
- **Analytics**: Vercel Analytics 1.6.1

### Development Tools
- **Build Tool**: Next.js built-in (Turbopack)
- **CSS Processing**: PostCSS 8.5 with Tailwind
- **Type Checking**: TypeScript strict mode

---

## Core Features

### 1. Citizen Interface

#### Status Checking
- Citizens can check application status using reference numbers (e.g., BP-2024-0481)
- Visual timeline showing application progress through stages
- Outstanding actions with due dates
- Stage explanations in citizen's language

#### Permit Application Guidance
- Step-by-step guidance for different permit types:
  - Building permits
  - Renovation permits
  - Demolition permits
  - Zoning variances
- Document requirements checklist
- Fee and timeline information
- Direct link to application form

#### Human Escalation
- One-click escalation to caseworker
- Automatic context capture (full conversation + application data)
- Reason categorization for triage
- Optional contact name collection

### 2. Caseworker Dashboard

#### Queue Management
- Real-time escalation queue with 4-second polling
- Filter by status: All, New, Claimed, Resolved
- Status counts for quick overview
- Automatic sorting by creation date (newest first)

#### Context-Rich Case View
- Full conversation transcript in citizen's language
- Linked application details (if available)
- Escalation reason and citizen's description
- One-click claim and resolve actions
- No need for citizens to repeat information

---

## Data Models

### Application

```typescript
interface Application {
  id: string                    // e.g., "BP-2024-0481"
  type: PermitType              // building_permit | renovation | demolition | zoning_variance
  applicantName: string
  address: string
  submittedDate: string         // ISO date
  estimatedDecisionDate: string // ISO date
  assignedOffice: string
  stages: ApplicationStage[]
  outstandingActions: OutstandingAction[]
}
```

### ApplicationStage

```typescript
interface ApplicationStage {
  key: string           // Translation key: submitted | intake_review | plan_review | inspection | decision
  status: StageStatus   // done | current | pending
  date?: string         // ISO date when stage completed/started
}
```

### Escalation

```typescript
interface Escalation {
  id: string                    // e.g., "ESC-101"
  createdAt: string             // ISO timestamp
  status: EscalationStatus      // new | claimed | resolved
  locale: Locale                // en | es | ar
  reason: EscalationReason      // status_unclear | needs_correction | documents_problem | dispute | other
  detail: string                // Citizen's description
  applicationId?: string        // Linked application reference
  applicationSnapshot?: {       // Snapshot of application at escalation time
    type: PermitType
    currentStageKey: string
    estimatedDecisionDate: string
    assignedOffice: string
  }
  summary: {
    headlineKey: string         // Translation key for summary
    contactName?: string
  }
  transcript: TranscriptEntry[] // Full conversation history
  claimedBy?: string           // Caseworker who claimed
  resolvedNote?: string        // Resolution notes
}
```

### TranscriptEntry

```typescript
interface TranscriptEntry {
  role: "bot" | "citizen"
  text: string              // Already-rendered text in citizen's language
  at: string                // ISO timestamp
}
```

---

## Application Structure

```
data-ai-pitch-challenge-main/
├── app/
│   ├── api/
│   │   ├── applications/
│   │   │   └── route.ts          # GET /api/applications?ref=XXX
│   │   └── escalations/
│   │       └── route.ts          # GET, POST, PATCH /api/escalations
│   ├── caseworker/
│   │   └── page.tsx              # Caseworker dashboard page
│   ├── globals.css               # Global styles & Tailwind config
│   ├── layout.tsx                # Root layout with fonts & analytics
│   └── page.tsx                  # Citizen chat interface (home)
├── components/
│   ├── caseworker/
│   │   ├── caseworker-dashboard.tsx  # Main dashboard component
│   │   └── escalation-card.tsx       # Individual escalation card
│   ├── citizen/
│   │   ├── apply-widgets.tsx         # Apply flow widgets (docs, fees, ready)
│   │   ├── citizen-chat.tsx          # Main chat interface with conversation logic
│   │   ├── citizen-header.tsx        # Header with language/accessibility controls
│   │   ├── message-bubble.tsx        # Chat message display
│   │   ├── quick-replies.tsx         # Quick reply buttons
│   │   ├── skip-to-chat.tsx          # Accessibility skip link
│   │   └── status-timeline.tsx       # Application status timeline
│   ├── ui/
│   │   ├── badge.tsx                 # Badge component
│   │   ├── button.tsx                # Button component
│   │   └── card.tsx                  # Card component
│   └── settings-provider.tsx         # Global settings context (locale, text size)
├── lib/
│   ├── case-store.ts             # In-memory data store & business logic
│   ├── conversation.ts           # Conversation state types & helpers
│   ├── i18n.ts                   # Translation dictionaries (EN, ES, AR)
│   ├── types.ts                  # Shared TypeScript types
│   └── utils.ts                  # Utility functions (cn for classnames)
├── public/                       # Static assets (icons, images)
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
└── next.config.mjs              # Next.js configuration
```

---

## API Endpoints

### GET /api/applications

**Purpose**: Look up application by reference number

**Query Parameters**:
- `ref` (string): Application reference number (e.g., "BP-2024-0481")

**Response**:
```json
{
  "found": true,
  "application": {
    "id": "BP-2024-0481",
    "type": "building_permit",
    "applicantName": "Maria Gonzalez",
    "address": "1420 Elm Street, Unit 3",
    "submittedDate": "2024-03-02",
    "estimatedDecisionDate": "2024-05-15",
    "assignedOffice": "Central Building Office",
    "stages": [...],
    "outstandingActions": [...]
  }
}
```

**Error Response** (404):
```json
{
  "found": false
}
```

### GET /api/escalations

**Purpose**: List all escalations for caseworker dashboard

**Response**:
```json
{
  "escalations": [
    {
      "id": "ESC-101",
      "createdAt": "2024-03-20T10:30:00Z",
      "status": "new",
      "locale": "es",
      "reason": "status_unclear",
      "detail": "No entiendo mi estado",
      "applicationId": "BP-2024-0481",
      "transcript": [...],
      ...
    }
  ]
}
```

### POST /api/escalations

**Purpose**: Create new escalation from citizen

**Request Body**:
```json
{
  "locale": "en",
  "reason": "status_unclear",
  "detail": "I don't understand my status",
  "applicationId": "BP-2024-0481",
  "contactName": "Maria Gonzalez",
  "transcript": [
    {
      "role": "bot",
      "text": "Hello. I can help you with city building permits.",
      "at": "2024-03-20T10:25:00Z"
    },
    ...
  ]
}
```

**Response** (201):
```json
{
  "escalation": {
    "id": "ESC-101",
    ...
  }
}
```

### PATCH /api/escalations

**Purpose**: Update escalation status (claim or resolve)

**Request Body**:
```json
{
  "id": "ESC-101",
  "status": "claimed",
  "claimedBy": "John Smith"
}
```

**Response**:
```json
{
  "escalation": {
    "id": "ESC-101",
    "status": "claimed",
    "claimedBy": "John Smith",
    ...
  }
}
```

**Error Response** (404):
```json
{
  "error": "not_found"
}
```

---

## Internationalization (i18n)

### Supported Languages

1. **English (en)** - Left-to-right (LTR)
2. **Spanish (es)** - Left-to-right (LTR)
3. **Arabic (ar)** - Right-to-left (RTL)

### Implementation

All translations are stored in [`lib/i18n.ts`](lib/i18n.ts:1) with three complete dictionaries:

```typescript
const en: Dict = {
  "app.authority": "City Building Authority",
  "welcome.greeting": "Hello. I can help you with city building permits.",
  ...
}

const es: Dict = {
  "app.authority": "Autoridad de Construcción de la Ciudad",
  "welcome.greeting": "Hola. Puedo ayudarle con los permisos de construcción de la ciudad.",
  ...
}

const ar: Dict = {
  "app.authority": "هيئة البناء في المدينة",
  "welcome.greeting": "مرحباً. يمكنني مساعدتك في تصاريح البناء في المدينة.",
  ...
}
```

### Translation Function

```typescript
export function translate(locale: Locale, key: string, vars?: Record<string, string>): string {
  const dict = dictionaries[locale] ?? en
  let value = dict[key] ?? en[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), v)
    }
  }
  return value
}
```

### RTL Support

The system automatically applies RTL layout for Arabic:

```typescript
export function dirFor(locale: Locale): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === locale)?.dir ?? "ltr"
}
```

The direction is applied to the `<html>` element:

```typescript
useEffect(() => {
  document.documentElement.lang = locale
  document.documentElement.dir = dir
}, [locale, dir])
```

### Translation Categories

- **App Shell**: Authority name, assistant name, navigation
- **Accessibility**: Screen reader labels, text size controls
- **Composer**: Input placeholder, send button, restart
- **Welcome/Menu**: Greeting, main menu options
- **Status Flow**: Reference lookup, timeline, explanations
- **Apply Flow**: Step-by-step guidance, document lists, fees
- **Escalation Flow**: Reason selection, confirmation, completion
- **Caseworker**: Dashboard labels, status filters, actions
- **Permit Types**: Building, renovation, demolition, zoning
- **Stages**: Submitted, intake review, plan review, inspection, decision
- **Actions**: Upload documents, pay fees, submit notices

---

## State Management

### Global Settings (SettingsProvider)

Managed via React Context in [`components/settings-provider.tsx`](components/settings-provider.tsx:1):

```typescript
interface AppSettings {
  locale: Locale              // Current language
  setLocale: (l: Locale) => void
  dir: "ltr" | "rtl"         // Text direction
  largeText: boolean         // Accessibility text scaling
  toggleLargeText: () => void
  t: (key: string, vars?: Record<string, string>) => string  // Translation function
}
```

### Conversation State (CitizenChat)

Local component state in [`components/citizen/citizen-chat.tsx`](components/citizen/citizen-chat.tsx:1):

```typescript
interface ConversationState {
  step: Step                      // Current conversation step
  messages: ChatMessage[]         // Full message history
  linkedApplicationId?: string    // Application found during status check
  applyPermit?: PermitType       // Permit type chosen in apply flow
  escReason?: EscalationReason   // Escalation reason being collected
  escName?: string               // Contact name for escalation
}
```

### Conversation Steps

```typescript
type Step =
  | "welcome"              // Initial greeting & main menu
  | "status_askRef"        // Asking for reference number
  | "status_result"        // Showing application status
  | "status_notFound"      // Reference not found
  | "apply_pickType"       // Choosing permit type
  | "apply_docs"           // Showing document requirements
  | "apply_fee"            // Showing fees & timing
  | "apply_ready"          // Ready to start application
  | "esc_reason"           // Choosing escalation reason
  | "esc_askName"          // Collecting contact name
  | "esc_confirm"          // Confirming escalation details
  | "esc_done"             // Escalation submitted
```

### Caseworker Dashboard State

Uses SWR for real-time data fetching with 4-second polling:

```typescript
const { data, isLoading, mutate } = useSWR<{ escalations: Escalation[] }>(
  "/api/escalations",
  fetcher,
  { refreshInterval: 4000 }
)
```

---

## User Flows

### Flow 1: Check Application Status

```
1. Citizen clicks "Check my application status"
2. System asks for reference number
3. Citizen enters reference (e.g., "BP-2024-0481")
4. System fetches application via GET /api/applications?ref=BP-2024-0481
5. System displays:
   - Status timeline with completed/current/pending stages
   - Outstanding actions with due dates
   - Estimated decision date
   - Assigned office
6. Citizen can:
   - Ask for stage explanation
   - Report incorrect information (escalate)
   - Return to main menu
```

### Flow 2: Apply for Permit

```
1. Citizen clicks "Help me apply for a permit"
2. System asks "What kind of permit do you need?"
3. Citizen selects permit type (building/renovation/demolition/zoning)
4. System shows document requirements (Step 1 of 3)
5. Citizen clicks "Next step"
6. System shows fees and timing (Step 2 of 3)
7. Citizen clicks "Next step"
8. System shows "You're ready to apply" (Step 3 of 3)
9. Citizen can:
   - Start application (opens form - not implemented in POC)
   - Request help completing it (escalate)
```

### Flow 3: Escalate to Caseworker

```
1. Citizen clicks "Talk to a person" (or escalates from other flows)
2. System explains context will be preserved
3. System asks "What do you need help with?"
4. Citizen selects reason:
   - I don't understand my status
   - Something in my application is wrong
   - I have a problem with documents
   - I disagree with a decision
   - Something else
5. System asks for name (optional, can skip)
6. System shows confirmation with:
   - Reason
   - Linked application (if any)
   - Contact name (if provided)
7. Citizen confirms
8. System creates escalation via POST /api/escalations
9. System shows escalation ID and confirmation
10. Caseworker sees escalation in dashboard with full context
```

### Flow 4: Caseworker Handles Escalation

```
1. Caseworker opens dashboard at /caseworker
2. Dashboard shows all escalations with filters (All/New/Claimed/Resolved)
3. Caseworker sees:
   - Escalation ID and creation time
   - Citizen's language
   - Reason and description
   - Linked application details (if any)
   - Full conversation transcript
4. Caseworker clicks "Claim case"
5. System updates via PATCH /api/escalations
6. Caseworker reviews context (no need to ask citizen to repeat)
7. Caseworker handles case externally
8. Caseworker clicks "Mark resolved"
9. System updates escalation status
```

---

## Accessibility Features

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**
   - All interactive elements accessible via Tab/Shift+Tab
   - Quick replies navigable with arrow keys
   - Skip to main content link

2. **Screen Reader Support**
   - Semantic HTML (header, main, nav, article)
   - ARIA labels on all controls
   - Live region for new messages (`aria-live="polite"`)
   - Descriptive button labels

3. **Visual Accessibility**
   - High contrast text (4.5:1 minimum)
   - Large text toggle (increases base font size)
   - Focus indicators on all interactive elements
   - No color-only information

4. **Language Support**
   - `lang` attribute on HTML element
   - `dir` attribute for RTL languages
   - Native form controls respect language direction

### Accessibility Components

#### Skip to Chat Link
[`components/citizen/skip-to-chat.tsx`](components/citizen/skip-to-chat.tsx:1)
```typescript
<a href="#chat-messages" className="sr-only focus:not-sr-only">
  {t("a11y.skipToChat")}
</a>
```

#### Text Size Toggle
[`components/citizen/citizen-header.tsx`](components/citizen/citizen-header.tsx:62-75)
```typescript
<button
  type="button"
  onClick={toggleLargeText}
  aria-pressed={largeText}
>
  <Type className="size-4" />
  {largeText ? t("a11y.normalText") : t("a11y.largerText")}
</button>
```

#### Live Region for Messages
```typescript
<div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only">
  {/* Latest message announced to screen readers */}
</div>
```

---

## Component Architecture

### Citizen Interface Components

#### CitizenChat
**Path**: [`components/citizen/citizen-chat.tsx`](components/citizen/citizen-chat.tsx:1)

**Responsibilities**:
- Manages conversation state and flow
- Handles user input and quick replies
- Fetches application data
- Creates escalations
- Renders message history and widgets

**Key Functions**:
- `lookupStatus(ref)`: Fetches application by reference
- `submitEscalation(reason, detail, name)`: Creates escalation with transcript
- `handleQuickReply(id)`: Processes button clicks and advances conversation
- `handleTextSubmit()`: Processes free-text input (reference numbers)

#### CitizenHeader
**Path**: [`components/citizen/citizen-header.tsx`](components/citizen/citizen-header.tsx:1)

**Responsibilities**:
- Displays authority branding
- Language selector (EN/ES/AR)
- Text size toggle
- Link to caseworker dashboard

#### MessageBubble
**Path**: [`components/citizen/message-bubble.tsx`](components/citizen/message-bubble.tsx:1)

**Responsibilities**:
- Renders individual chat messages
- Differentiates bot vs citizen messages
- Displays widgets (status timeline, apply steps, escalation summary)

#### StatusTimeline
**Path**: [`components/citizen/status-timeline.tsx`](components/citizen/status-timeline.tsx:1)

**Responsibilities**:
- Visual timeline of application stages
- Shows completed (✓), current (→), and pending (○) stages
- Displays dates for completed stages
- Lists outstanding actions with due dates

#### QuickReplies
**Path**: [`components/citizen/quick-replies.tsx`](components/citizen/quick-replies.tsx:1)

**Responsibilities**:
- Renders button options for user
- Supports icons and custom styling
- Keyboard accessible

#### ApplyWidgets
**Path**: [`components/citizen/apply-widgets.tsx`](components/citizen/apply-widgets.tsx:1)

**Components**:
- `ApplyDocs`: Shows document requirements for permit type
- `ApplyFee`: Shows fee and timing information
- `ApplyReady`: Final step with application start button
- `EscalationSummary`: Confirmation before submitting escalation

### Caseworker Components

#### CaseworkerDashboard
**Path**: [`components/caseworker/caseworker-dashboard.tsx`](components/caseworker/caseworker-dashboard.tsx:1)

**Responsibilities**:
- Fetches escalations with SWR (4-second polling)
- Filters by status (All/New/Claimed/Resolved)
- Displays escalation count badges
- Handles claim and resolve actions
- Sorts by creation date (newest first)

#### EscalationCard
**Path**: [`components/caseworker/escalation-card.tsx`](components/caseworker/escalation-card.tsx:1)

**Responsibilities**:
- Displays single escalation with all context
- Shows citizen's language and reason
- Displays linked application details
- Shows full conversation transcript
- Provides claim/resolve buttons
- Expandable/collapsible design

### Shared Components

#### SettingsProvider
**Path**: [`components/settings-provider.tsx`](components/settings-provider.tsx:1)

**Responsibilities**:
- Global state for locale and text size
- Applies language and direction to HTML element
- Provides translation function to all components

---

## Deployment & Configuration

### Environment Variables

```bash
# Production analytics (optional)
NODE_ENV=production
```

### Build & Run

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### Next.js Configuration

**File**: [`next.config.mjs`](next.config.mjs:1)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration options here
}

export default nextConfig
```

### TypeScript Configuration

**File**: [`tsconfig.json`](tsconfig.json:1)

Key settings:
- Strict mode enabled
- Path aliases: `@/*` maps to project root
- Target: ES6
- Module resolution: bundler

### Tailwind Configuration

**File**: [`app/globals.css`](app/globals.css:1)

- Custom theme with CSS variables
- Dark mode support (via `.dark` class)
- Custom color palette for government branding
- Responsive breakpoints

---

## Data Store Implementation

### In-Memory Store

**File**: [`lib/case-store.ts`](lib/case-store.ts:1)

**Current Implementation**:
- In-memory arrays for applications and escalations
- Seeded with 4 sample applications
- Data persists only during server process lifetime
- Resets on server restart

**Seeded Applications**:
1. BP-2024-0481 (Building Permit) - Maria Gonzalez
2. RN-2024-1192 (Renovation) - Ahmed Hassan
3. DM-2024-0067 (Demolition) - John Carter
4. ZV-2023-0904 (Zoning Variance) - Priya Nair

**Key Functions**:
- `findApplication(reference)`: Lookup by reference number (case-insensitive)
- `listApplications()`: Get all applications
- `createEscalation(input)`: Create new escalation with auto-generated ID
- `listEscalations()`: Get all escalations
- `updateEscalation(id, patch)`: Update escalation status
- `currentStageKey(app)`: Get current stage of application

**Production Considerations**:
- Replace with PostgreSQL/MySQL for persistence
- Add authentication and authorization
- Implement audit logging
- Add data validation and sanitization
- Consider caching layer (Redis)

---

## Security Considerations

### Current Implementation (POC)

⚠️ **This is a proof-of-concept with no authentication or authorization**

### Production Requirements

1. **Authentication**
   - Citizen authentication (OAuth, SAML, or government ID)
   - Caseworker authentication (SSO with role-based access)
   - Session management with secure cookies

2. **Authorization**
   - Citizens can only access their own applications
   - Caseworkers can only access assigned escalations
   - Role-based permissions for different caseworker levels

3. **Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Implement rate limiting on API endpoints
   - Sanitize all user inputs
   - Implement CSRF protection

4. **Privacy**
   - GDPR/privacy law compliance
   - Data retention policies
   - Right to deletion
   - Audit trails for data access

5. **API Security**
   - API key authentication for internal services
   - Input validation on all endpoints
   - SQL injection prevention (when using database)
   - XSS prevention (React handles this by default)

---

## Performance Optimization

### Current Optimizations

1. **React Server Components**
   - Static rendering where possible
   - Reduced client-side JavaScript

2. **SWR for Data Fetching**
   - Automatic revalidation
   - Optimistic updates
   - Cache management

3. **Code Splitting**
   - Automatic route-based splitting by Next.js
   - Dynamic imports for large components

4. **Image Optimization**
   - Next.js Image component (not currently used)
   - SVG icons for scalability

### Production Recommendations

1. **Caching**
   - Redis for session data
   - CDN for static assets
   - API response caching

2. **Database Optimization**
   - Indexed queries on reference numbers
   - Connection pooling
   - Read replicas for reporting

3. **Monitoring**
   - Application performance monitoring (APM)
   - Error tracking (Sentry, etc.)
   - User analytics
   - API endpoint monitoring

---

## Testing Strategy

### Recommended Test Coverage

1. **Unit Tests**
   - Translation function
   - Data store functions
   - Utility functions
   - Component logic

2. **Integration Tests**
   - API endpoints
   - Conversation flows
   - Escalation creation
   - Status lookup

3. **E2E Tests**
   - Complete user journeys
   - Multi-language flows
   - Accessibility compliance
   - Mobile responsiveness

4. **Accessibility Tests**
   - Automated WCAG checks (axe-core)
   - Screen reader testing
   - Keyboard navigation
   - Color contrast

### Testing Tools

- **Jest**: Unit and integration tests
- **React Testing Library**: Component tests
- **Playwright/Cypress**: E2E tests
- **axe-core**: Accessibility testing
- **Lighthouse**: Performance and accessibility audits

---

## Future Enhancements

### Phase 2 Features

1. **Real-time Notifications**
   - WebSocket for live updates
   - Push notifications for status changes
   - SMS/email notifications

2. **Document Upload**
   - Secure file upload for citizens
   - Document preview for caseworkers
   - Virus scanning

3. **Payment Integration**
   - Online fee payment
   - Payment status tracking
   - Receipt generation

4. **Advanced Search**
   - Full-text search for caseworkers
   - Filter by date range, office, permit type
   - Export to CSV/PDF

5. **Analytics Dashboard**
   - Escalation trends
   - Average resolution time
   - Citizen satisfaction metrics
   - Language usage statistics

6. **AI Enhancements**
   - Natural language understanding for free-text input
   - Automatic categorization of escalations
   - Suggested responses for caseworkers
   - Sentiment analysis

7. **Mobile App**
   - Native iOS/Android apps
   - Offline support
   - Camera integration for document capture

---

## Maintenance & Support

### Monitoring

1. **Application Health**
   - Uptime monitoring
   - Error rate tracking
   - Response time metrics

2. **User Behavior**
   - Conversation completion rates
   - Escalation reasons distribution
   - Language preference trends

3. **System Resources**
   - Server CPU/memory usage
   - Database performance
   - API rate limits

### Backup & Recovery

1. **Data Backup**
   - Daily database backups
   - Transaction log backups
   - Backup retention policy

2. **Disaster Recovery**
   - Recovery time objective (RTO)
   - Recovery point objective (RPO)
   - Failover procedures

### Documentation Updates

- Keep translation dictionaries current
- Document API changes
- Update user guides
- Maintain runbooks for common issues

---

## Conclusion

The Permit Help Assistant demonstrates a modern, accessible approach to citizen services with:

- **Multilingual support** reducing language barriers
- **Context preservation** eliminating citizen frustration
- **Accessibility first** ensuring equal access
- **Clean architecture** enabling easy maintenance and extension

The system is designed as a proof-of-concept that can be extended into a production-ready platform with proper authentication, database persistence, and additional features.

---

## Appendix: Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| [`app/page.tsx`](app/page.tsx:1) | Citizen home page | 15 |
| [`app/layout.tsx`](app/layout.tsx:1) | Root layout with fonts | 50 |
| [`app/caseworker/page.tsx`](app/caseworker/page.tsx:1) | Caseworker page | 9 |
| [`app/api/applications/route.ts`](app/api/applications/route.ts:1) | Application lookup API | 12 |
| [`app/api/escalations/route.ts`](app/api/escalations/route.ts:1) | Escalation CRUD API | 28 |
| [`components/citizen/citizen-chat.tsx`](components/citizen/citizen-chat.tsx:1) | Main chat interface | 400+ |
| [`components/citizen/citizen-header.tsx`](components/citizen/citizen-header.tsx:1) | Header with controls | 80 |
| [`components/caseworker/caseworker-dashboard.tsx`](components/caseworker/caseworker-dashboard.tsx:1) | Caseworker queue | 150+ |
| [`components/settings-provider.tsx`](components/settings-provider.tsx:1) | Global settings context | 54 |
| [`lib/case-store.ts`](lib/case-store.ts:1) | Data store & logic | 171 |
| [`lib/conversation.ts`](lib/conversation.ts:1) | Conversation types | 73 |
| [`lib/i18n.ts`](lib/i18n.ts:1) | Translation dictionaries | 487 |
| [`lib/types.ts`](lib/types.ts:1) | TypeScript types | 80 |

---

**Document Version**: 1.0  
**Last Updated**: 2026-06-10  
**Author**: Technical Documentation Team