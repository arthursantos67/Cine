# CinePrime - Frontend Product Requirements Document

## Frontend Software Requirements Specification

**Project:** cineprime
**Document type:** Product Requirements Document (PRD) - Frontend only  
**Version:** 2.0
**Last update:** 2026-06-21
**Derived from:** Full-Stack PRD v3.0 (2026-06-21)
**Audited against:** current Next.js app, backend serializers/views, README files, Docker configuration, and CI workflow

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [System Context](#2-system-context)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Use Cases](#5-use-cases)
6. [Page and Component Specification](#6-page-and-component-specification)
7. [API Integration Contract](#7-api-integration-contract)
8. [State Management Strategy](#8-state-management-strategy)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Security and Access Control](#10-security-and-access-control)
11. [Testing Requirements](#11-testing-requirements)
12. [Operational Requirements](#12-operational-requirements)
13. [Requirements Traceability Matrix](#13-requirements-traceability-matrix)
14. [Out of Scope](#14-out-of-scope)

---

## 1. Purpose and Scope

This document defines the frontend requirements for **CinePrime**, a browser-based cinema ticket reservation platform. The frontend is a Next.js web application that consumes the Django/DRF REST API to support the complete purchase journey: movie discovery, session selection, seat selection, ticket type selection, checkout, order confirmation, and access to purchased tickets.

This PRD is derived from the full-stack PRD and focuses only on frontend behavior, user experience, API integration, client-side state, accessibility, quality requirements, and operational expectations. Backend models, server infrastructure, Redis, Celery, and database concerns are documented in the full-stack PRD and backend README.

### 1.1 Current Repository State

The current frontend is a Next.js 15 App Router application with fully implemented user-facing purchase flows, a complete admin UI, i18n support, and an HTTP client in `src/api/client.ts`. Unit tests use the Node.js test runner with `tsx`. ESLint, unit tests, and production build validation run in GitHub Actions.

This document describes the intended complete frontend product, while keeping routes, payloads, response fields, and implementation expectations aligned with the backend and scaffold that currently exist in the repository.

### 1.2 Product Goals

- Provide a smooth ticket purchase experience from catalog browsing to checkout.
- Minimize friction in the reservation flow with immediate, clear UI feedback.
- Represent temporary seat reservations, lock expiration, and checkout state accurately in the UI.
- Keep protected operations secure without exposing tokens in persistent browser storage.
- Make the application accessible and usable on both desktop and mobile devices.

### 1.3 In Scope

- All frontend routes in `src/app/`: public purchase flow, admin panel, auth pages.
- Shared UI components and page-specific behavior.
- Authentication, route guarding (user, admin, master), and JWT handling on the client.
- API integration contracts for all backend endpoints used by the frontend.
- Client-side reservation state and checkout state.
- Admin UI: genre, movie, room, session, pricing, and user management pages.
- TMDB integration proxy for admin movie creation.
- Movie reviews and interest features.
- i18n (pt-BR / en-US) and language switcher.
- Frontend accessibility, responsiveness, performance, and testability requirements.

### 1.4 Out of Scope for This Document

- Backend business logic, data models, and infrastructure internals.
- Celery, Redis, PostgreSQL, and backend deployment details.
- Real payment gateway integration.
- Backend fields that do not currently exist, such as `age_rating` and `trailer_url`, except where explicitly listed as future evolution.

---

## 2. System Context

### 2.1 Frontend Positioning

The frontend is a Next.js web application consumed through the user's browser. All durable data and business rules are delegated to the backend through HTTP(S) REST API calls. The frontend must not access the database, Redis, Celery, or other backend infrastructure directly.

```text
User Browser
  |
  | Next.js frontend
  | Pages -> Components -> API client
  |
  | HTTP(S) with Bearer JWT
  v
Django/DRF REST API
```

### 2.2 Actors

| Actor | Description | Frontend Capabilities |
|---|---|---|
| Visitor | Unauthenticated user | Browse home, catalog, movie details, and seat maps; access login and registration; see review/interest counts |
| Authenticated User | User with a valid JWT access token | All visitor capabilities plus: reserve seats, choose ticket types, checkout, view profile, view tickets, submit reviews, vote on reviews, register movie interest |
| Admin (Staff) | User with `is_staff = true` in the JWT payload | All authenticated capabilities plus: access `/admin/*` for catalog and session management, room layout editing, pricing configuration |
| Master Admin | User with `is_superuser = true` | All staff capabilities plus: access `/admin/users/` for user role management and audit log |

### 2.3 Integration Constraints

- The frontend must consume only the backend REST API.
- The API base URL is configured through `NEXT_PUBLIC_API_BASE_URL`.
- JWT tokens must never be stored in `localStorage` or `sessionStorage`.
- Error responses follow the backend envelope `{ error: { code, message, status, details } }`.
- User-facing error messages must be derived from `error.code`, not by directly displaying backend English messages.

---

## 3. Frontend Architecture

### 3.1 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 with App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (primary); `src/styles/tokens.css` for design tokens; `src/app/globals.css` for CSS reset, theme-level variables, and accessibility rules; `src/styles/public-legacy.css` is a temporary migration shim — do not add new component CSS there |
| State Management | React Context and custom hooks; Zustand/Jotai may be introduced if complexity justifies it |
| API Communication | Native `fetch` wrapped by `src/api/client.ts` |
| i18n | Custom `src/i18n/` layer with locale dictionaries (`pt-BR`, `en-US`), `I18nProvider`, `useI18n` hook, and `cineprime_locale` cookie persistence |
| Tests | Node.js test runner with `tsx` for pure modules and logic; Testing Library when React component tests are added; Playwright for E2E |
| Linting | ESLint |

### 3.2 Directory Structure

```text
frontend/
`-- src/
    |-- app/
    |   |-- page.tsx                          # Home
    |   |-- movies/[movieId]/page.tsx         # Movie detail
    |   |-- sessions/[sessionId]/seats/page.tsx
    |   |-- ticket-types/page.tsx
    |   |-- checkout/page.tsx
    |   |-- confirmation/page.tsx
    |   |-- my-tickets/page.tsx
    |   |-- login/page.tsx
    |   |-- register/page.tsx
    |   |-- admin/                            # Admin panel
    |   |   |-- page.tsx                      # Dashboard
    |   |   |-- layout.tsx                    # Admin shell layout
    |   |   |-- genres/page.tsx
    |   |   |-- movies/page.tsx
    |   |   |-- movies/new/page.tsx
    |   |   |-- movies/[id]/edit/page.tsx
    |   |   |-- rooms/page.tsx
    |   |   |-- rooms/new/page.tsx
    |   |   |-- rooms/[roomId]/edit/page.tsx
    |   |   |-- rooms/[roomId]/layout/page.tsx
    |   |   |-- sessions/page.tsx
    |   |   |-- sessions/new/page.tsx
    |   |   |-- sessions/[id]/edit/page.tsx
    |   |   |-- pricing/page.tsx
    |   |   `-- users/page.tsx
    |   `-- api/
    |       |-- tmdb/movie/[id]/route.ts      # TMDB proxy
    |       `-- tmdb/search/route.ts
    |-- api/
    |   |-- client.ts
    |   |-- auth.ts
    |   |-- catalog.ts
    |   |-- reservation.ts
    |   |-- checkout.ts
    |   |-- tickets.ts
    |   |-- reviews.ts
    |   |-- interest.ts
    |   `-- admin.ts
    |-- components/
    |   |-- ui/                               # Button, Badge, Select, Tabs, etc.
    |   |-- layout/                           # AppHeader, LanguageSwitcher
    |   |-- auth/                             # LoginForm, RegisterForm, ProtectedRoute, AdminRoute, MasterRoute
    |   |-- movies/                           # MovieCard, FeaturedMovieBanner, MovieDetail, SessionBadges, StarRating, MovieReviews
    |   |-- seats/                            # SeatMap, SeatSelectionActions
    |   |-- reservations/                     # TicketTypeSelection, CheckoutReview, CheckoutConfirmation, OrderSummaryPanel, PurchaseFlowGuard, CheckoutStepIndicator
    |   |-- tickets/                          # TicketCard, MyTicketsClient
    |   `-- admin/                            # AdminShell, AdminTable, AdminToolbar, AdminMovieForm, AdminRoomForm, AdminRoomLayoutEditor, AdminBatchSeatWizard, AdminSessionForm, AdminGenreList, AdminUserList, AdminPricingList
    |-- contexts/
    |   |-- AuthContext.tsx
    |   |-- auth-state.ts
    |   |-- auth-persistence.ts
    |   `-- ReservationContext.tsx
    |-- hooks/
    |   `-- useReservationCountdown.ts
    |-- i18n/
    |   |-- index.ts
    |   |-- locales.ts
    |   |-- messages.ts
    |   |-- I18nProvider.tsx
    |   `-- server.ts
    `-- types/
        |-- catalog.ts
        |-- reservation.ts
        `-- ticket.ts
```

### 3.3 API Client Layer

The `src/api/` modules must encapsulate all HTTP calls.

Responsibilities:

- Resolve the API base URL from `NEXT_PUBLIC_API_BASE_URL`.
- Attach `Authorization: Bearer <access_token>` to protected requests.
- Attempt token refresh when a protected request returns `401`.
- Redirect to `/login` when refresh fails.
- Preserve the backend error envelope inside a typed `ApiError`.
- Preserve `status`, `error.code`, `error.details`, and correlation metadata when available.
- Handle DRF paginated list responses in the shape `{ count, next, previous, results }`.
- Expose domain-specific typed functions such as `catalogApi.getMovies()`, `reservationApi.reserveSeats()`, and `checkoutApi.checkout()`.

---

## 4. Functional Requirements

### FE-01 Home Page

The home page must display a featured movie banner using movies where `is_featured = true`.

Below the banner, catalog sections are populated by movie lifecycle status:

- **Now Showing**: movies with `status = em_cartaz`
- **Pre-Sale**: movies with `status = pre_venda`
- **Upcoming**: movies with `status = em_breve` when an upcoming rail or view is displayed

Each movie card must show poster, title, genres, and duration. Clicking a movie card must navigate to `/movies/{movieId}`.

The current backend does not expose an age rating field. The frontend must not invent or hard-code age rating values. Age rating badges may be added only after the backend exposes a compatible field.

### FE-02 Movie Detail and Session Selection Page

The movie detail page must show:

- Movie poster and title
- Synopsis
- Genres
- Duration
- Release date when useful to the UI

The page must provide a date selector. When a date is selected, the frontend must fetch sessions with:

```text
GET /api/v1/catalog/sessions/?movie=<movieId>&date=<YYYY-MM-DD>
```

Sessions must be grouped by room display name and ordered by time. When metadata is available, session cards must show compact badges for room experience, projection format, audio format, and session type, such as `VIP`, `3D`, `Legendado`, `Dublado`, and `Pré-estreia`. Sessions without metadata must continue to render without badges.

Selecting a session must navigate to `/sessions/{sessionId}/seats`.

### FE-03 Seat Selection Page

The seat selection page must render an interactive visual map for the selected session.

Requirements:

- Show a "SCREEN" indicator above the first row.
- Show alphabetical row labels on both sides of the grid.
- Render seats by row and number.
- Preserve room-layout readability on narrow screens with horizontal scrolling if needed.
- Visually distinguish available, selected, reserved, purchased, and accessible seats.
- Display a required legend explaining all seat states.
- Allow visitors to view the seat map without authentication.
- Require authentication for reserve and release actions.
- When an unauthenticated user attempts to reserve a seat, redirect to `/login?redirect=<current_url>`.
- Reserve available seats through `POST /api/v1/reservation/sessions/{sessionId}/reservations/` with `seat_ids`.
- Release the current user's temporary reservation through `DELETE /api/v1/reservation/sessions/{sessionId}/reservations/` with `session_seat_ids`.
- Apply optimistic UI updates and revert them if locking fails.
- Display a countdown timer based on the backend `expires_at` value.
- Persist both `seat_id` and `session_seat_id` in client state, because temporary reservation receives `seat_id`, while release and checkout receive `session_seat_id`.

Page layout: the `CheckoutStepIndicator` must be placed inside the seat map column (stacked above the seat map), not as a separate full-width row outside the flex container. This ensures the step indicator's edges align with the seat map box and the order summary panel remains independent on the right. The seat map wrapper keeps its own `overflow-x-auto` with the `min-w-[900px]` inner div so horizontal scrolling is unaffected.

### FE-04 Ticket Type Selection Page

After reserving at least one seat, the user must proceed to `/ticket-types`.

For each reserved seat, the user must choose:

- **Full price**: API value `inteira`
- **Half price**: API value `meia`, priced at 50% of the session `base_price`

The subtotal must update immediately as ticket types change. A voucher/coupon input must be present, but coupon validation is out of scope for this version.

### FE-05 Checkout and Payment Page

The checkout page must show:

- Movie title
- Session date and time
- Room
- Session metadata badges when available
- Selected seats
- Ticket type per seat
- Unit price per seat
- Total amount
- Payment method selector with `cartao_credito` and `pix`

On confirmation, the page must:

1. Submit the checkout payload to the backend.
2. Show a loading state while the request is in progress.
3. Redirect to `/confirmation` on success.
4. Store the generated tickets in memory for the confirmation page.
5. Show a friendly error message derived from `error.code` on failure.

The frontend must not send `total_amount` in the default checkout payload. The total shown in the UI is informational; authoritative pricing belongs to the backend.

### FE-06 Order Confirmation and My Tickets

After checkout succeeds, the confirmation page must display the generated tickets.

Each ticket must show:

- Movie title
- Session date and time
- Room
- Seat identifier
- Ticket type
- Amount paid
- Payment method
- Ticket code
- Display-only QR code or barcode representation

If `/confirmation` is reloaded and in-memory checkout state is lost, the page must guide the user to `/my-tickets`.

The `/my-tickets` page must list authenticated user tickets and support filtering by `type=upcoming` and `type=past`.

### FE-07 Authentication Flow

The frontend must provide:

- Registration form with `username`, `email`, and `password`
- Login form with `email` and `password`

After successful login:

- Store `access` and `refresh` tokens in memory.
- Attach the access token to protected API requests.
- Attempt silent refresh through `/api/v1/auth/token/refresh/` when the access token expires.
- Redirect to `/login?redirect=<original_url>` when refresh fails.
- Redirect back to the original URL after successful login when a redirect parameter is present.

### FE-08 Admin UI

The frontend must provide a protected administration area at `/admin/*` visible only to staff and master admin users.

**General admin requirements:**

- All admin pages must be wrapped in `AdminShell` providing a sidebar navigation and consistent header.
- The `/admin/*` route subtree must be protected by `AdminRoute` (redirects non-staff to `/`).
- Admin list pages must use `AdminTable` with configurable columns and `AdminToolbar` for search/filter.
- Destructive actions (delete genre, delete movie, delete user) must be confirmed through `AdminConfirmDialog` before proceeding.

**Dashboard (`/admin/`):** display summary counts (total movies, now-showing movies, total rooms, sessions today) fetched from the admin summary endpoint.

**Genre management (`/admin/genres/`):** list all genres with name and source language; create new genres including `name` and optional translations.

**Movie management:**
- List (`/admin/movies/`): paginated table with title, status badge, featured indicator, age rating. Filter by status.
- Create (`/admin/movies/new/`): form with all movie fields including `title`, `synopsis`, `status`, `is_featured`, `poster_url`, `spotlight_url`, `duration_minutes`, `release_date`, `age_rating`, `classification_description`, `director`, cast members, genres, and translations. A TMDB search input allows searching by title and pre-filling all fields from the API result.
- Edit (`/admin/movies/{id}/edit/`): same form pre-populated with existing data; allows updating any field.

**Room management:**
- List (`/admin/rooms/`): table with name, experience type, display name, capacity.
- Create (`/admin/rooms/new/`): form with `name`, `capacity`, `experience_type`, `display_name`, `description`, and translations.
- Edit (`/admin/rooms/{roomId}/edit/`): same form pre-populated.
- Layout editor (`/admin/rooms/{roomId}/layout/`): visual seat row list; add rows via batch wizard (name + seat count per row, submitted to `/reservation/bulk-create-layout/`); add accessible-priority row (row name + accessible seat pair count, submitted to `/reservation/accessible-row/`); delete rows (blocked when future sessions exist).

**Session management:**
- List (`/admin/sessions/`): table with movie title, room, start/end times, base price, badges for format/audio/type. Filter by date and status.
- Create (`/admin/sessions/new/`): form with movie, room (via searchable select), start time, end time, base price, audio format, projection format, session type.
- Edit (`/admin/sessions/{id}/edit/`): same form pre-populated; sensitive fields locked when the session has reserved or purchased seats.

**Pricing management (`/admin/pricing/`):** table listing experience types and their configured base prices; inline edit (PATCH) for each price entry.

**User management (`/admin/users/`):** master-only (additionally protected by `MasterRoute`); table of all users filtered by role (master/staff/user); grant or revoke staff/master roles via inline actions with confirmation; expand row to show permission audit log; delete user account with confirmation.

### FE-09 TMDB Integration (Admin Movie Import)

The admin movie creation form at `/admin/movies/new/` must include a TMDB search input. When the admin types a query:

1. The frontend calls `GET /api/tmdb/search?q=<query>` (Next.js proxy route).
2. Up to eight results are shown as a dropdown with poster thumbnail, title, and year.
3. Selecting a result calls `GET /api/tmdb/movie/{id}` (Next.js proxy route).
4. The proxy returns `{ pt: { title, synopsis }, translations, poster_path, runtime, release_date, director, cast }`.
5. The form fields are pre-filled; the admin may edit any field before saving.

**Token resolution (`src/app/api/tmdb/get-token.ts`):**

The proxy resolves the TMDB token using the following priority:

1. `TMDB_API_READ_TOKEN` environment variable (server-only) — used directly if present.
2. If absent and `INTERNAL_API_KEY` is set, the proxy calls `GET /api/v1/internal/tmdb-token/` on the Django backend with the `X-Internal-Key` header. The token returned is in-memory cached for 5 minutes.

If neither resolves a token, the proxy returns an error and TMDB import is disabled in the UI.

**Admin token management:**

Master Admin users can set the TMDB token through the admin panel without requiring a server restart or environment variable change. The token is stored in the backend's `SiteConfig` table. The admin panel uses:

- `adminApi.getTmdbTokenStatus()` → `GET /api/v1/users/config/tmdb-token/` — returns `{ configured: boolean, hint: "<last-4-chars>" | null }`.
- `adminApi.setTmdbToken(value)` → `PUT /api/v1/users/config/tmdb-token/` — saves the token.

The token value is never returned in full — only the last 4 characters are shown as a confirmation hint.

**Server-to-server routing:**

`BACKEND_INTERNAL_URL` (server-only) overrides the target host for the internal backend call, enabling efficient Docker service-to-service communication (e.g., `http://backend:8000`). Falls back to `NEXT_PUBLIC_API_BASE_URL` if not set.

### FE-10 Movie Reviews UI

The movie detail page must include a reviews section:

- Display the movie's average rating (if any reviews exist) and total review count.
- List published reviews (paginated). Each item shows author username, rating (star display), comment, date, and vote counts (like/dislike).
- Authenticated users may cast or remove a like/dislike vote on any review that is not their own.
- An authenticated user who has not yet reviewed the movie sees a review form (star rating + optional comment). On submission, their review appears in the list.
- A user who already has a review sees their review highlighted with edit and delete actions.
- Visitors see the review list read-only without any action controls.
- Rating filter selector allows filtering the list by star value.

### FE-11 Movie Interest UI

On the movie detail page for upcoming movies (`status = em_breve`):

- Display the total number of interested users.
- Authenticated users see a toggle button ("Tenho interesse" / "Remover interesse") that calls `POST` or `DELETE` on the interest endpoint.
- The count updates optimistically on toggle.
- Visitors see the count with a call to action to log in.

### FE-12 Language Switcher

The global header must include a `LanguageSwitcher` component allowing the user to switch between `pt-BR` and `en-US`.

- The selected locale is persisted in a `cineprime_locale` cookie.
- On mount, the `I18nProvider` reads the cookie to initialize the locale.
- All UI text, date/time/currency formatting, enum label translations, accessible labels, and backend error-code messages must come from the active locale dictionary.
- The `Accept-Language` header is sent with API requests using the active locale.

---

## 5. Use Cases

### UC-1 Register User

**Actor:** Visitor  
**Precondition:** none  
**Main flow:** The visitor opens `/register`, submits username, email, and password, and the frontend calls `POST /api/v1/auth/register/`. On success, the user is redirected to `/login` with a confirmation message.  
**Alternative flow:** Validation errors from `VALIDATION_FAILED` are displayed inline.

### UC-2 Log In

**Actor:** Visitor  
**Precondition:** registered account exists  
**Main flow:** The visitor opens `/login`, submits email and password, and the frontend calls `POST /api/v1/auth/login/`. Tokens are stored in memory, and the user is redirected to the original URL or `/`.  
**Alternative flow:** `INVALID_CREDENTIALS` displays a form-level error.

### UC-3 Browse Home Page

**Actor:** Visitor or Authenticated User  
**Main flow:** The frontend fetches featured movies, now showing movies, and pre-sale movies. Skeleton loaders are shown while requests are in progress.

### UC-4 View Movie Details and Select Session

**Actor:** Visitor or Authenticated User  
**Main flow:** The user clicks a movie card, opens `/movies/{movieId}`, selects a date, views sessions filtered by movie and date, and selects a session. The frontend navigates to `/sessions/{sessionId}/seats`.

### UC-5 View Seat Map and Reserve Seats

**Actor:** Visitor or Authenticated User for viewing; Authenticated User for reservation  
**Precondition:** session selected  
**Main flow:** The frontend fetches the seat map and renders it. The authenticated user selects available seats. For each reservation operation, the frontend calls the temporary reservation endpoint, updates the UI optimistically, and starts or updates the countdown.  
**Alternative flow:** If locking fails with `SEAT_ALREADY_RESERVED`, the UI reverts the seat and shows a toast.

### UC-6 Select Ticket Types

**Actor:** Authenticated User  
**Precondition:** at least one active temporary reservation  
**Main flow:** The user opens `/ticket-types`, selects `inteira` or `meia` per seat, and the subtotal updates immediately. On confirmation, the user is sent to `/checkout`.

### UC-7 Complete Checkout

**Actor:** Authenticated User  
**Precondition:** reserved seats and ticket types selected  
**Main flow:** The user reviews the order, selects a payment method, and confirms checkout. The frontend submits the checkout payload. On success, tickets are stored in memory and the user is redirected to `/confirmation`.  
**Alternative flow:** API errors are shown without clearing the current order state when recovery is possible.

### UC-8 View Confirmation and My Tickets

**Actor:** Authenticated User  
**Precondition:** successful checkout  
**Main flow:** The confirmation page displays generated tickets. The user can navigate to `/my-tickets` and filter tickets by upcoming or past sessions.

### UC-9 Reservation Expiration

**Actor:** Authenticated User  
**Precondition:** active reservation reaches expiration  
**Main flow:** The countdown warns the user near expiration. When expired, the reservation state is reset and the user is redirected to a safe page with an explanatory message.

### UC-10 Browse Catalog Without Authentication

**Actor:** Visitor  
**Main flow:** The visitor can browse home, movie detail, sessions, and seat maps. Attempting to reserve a seat redirects to login while preserving the intended destination.

---

## 6. Page and Component Specification

### 6.1 Page Inventory

**Public / User pages:**

| Page | Route | Authentication |
|---|---|---|
| Home | `/` | No |
| Movie Detail | `/movies/{movieId}` | No |
| Seat Selection | `/sessions/{sessionId}/seats` | Partial: map public; reservation actions require auth |
| Ticket Type Selection | `/ticket-types` | Yes |
| Checkout | `/checkout` | Yes |
| Order Confirmation | `/confirmation` | Yes |
| My Tickets | `/my-tickets` | Yes |
| Login | `/login` | No |
| Register | `/register` | No |

**Admin pages:**

| Page | Route | Role Required |
|---|---|---|
| Admin Dashboard | `/admin/` | Staff |
| Genre Management | `/admin/genres/` | Staff |
| Movie List | `/admin/movies/` | Staff |
| Create Movie | `/admin/movies/new/` | Staff |
| Edit Movie | `/admin/movies/{id}/edit/` | Staff |
| Room List | `/admin/rooms/` | Staff |
| Create Room | `/admin/rooms/new/` | Staff |
| Edit Room | `/admin/rooms/{roomId}/edit/` | Staff |
| Room Layout Editor | `/admin/rooms/{roomId}/layout/` | Staff |
| Session List | `/admin/sessions/` | Staff |
| Create Session | `/admin/sessions/new/` | Staff |
| Edit Session | `/admin/sessions/{id}/edit/` | Staff |
| Pricing Management | `/admin/pricing/` | Staff |
| User Management | `/admin/users/` | Master |

### 6.2 Shared Components

#### Navigation Bar (`AppHeader`)

- Shows the CinePrime brand.
- Provides links for the main movie programming areas.
- Shows "Log in" and "Register" actions for visitors.
- Shows "My Tickets" and "Log out" actions for authenticated users.
- Shows "Admin" link for staff/master users.
- Includes the `LanguageSwitcher` component.

#### Language Switcher (`LanguageSwitcher`)

- Renders locale options (`pt-BR`, `en-US`).
- Writes the selection to `cineprime_locale` cookie.
- Triggers locale change through `I18nProvider`.

#### Movie Card (`MovieCard`)

- Shows poster, title, genres, and duration.
- Navigates to `/movies/{movieId}`.
- Shows age rating badge when `age_rating` is present in the API response.

#### Featured Banner (`FeaturedMovieBanner`)

- Displays movies marked with `is_featured = true`.
- Shows spotlight image (`spotlight_url`) when available; falls back to `poster_url`.
- Shows title, genre tags, and a primary session-selection action.

#### Star Rating (`StarRating`)

- Interactive half-star rating input (0.5–5.0 in 0.5 increments) for review submission.
- Read-only display mode for review lists showing filled/half/empty star glyphs.
- Accessible labels for each selectable value.

#### Countdown Timer

- Displays remaining reservation time as `mm:ss`.
- Uses the backend `expires_at` value.
- Applies warning styling when 60 seconds or less remain.
- Triggers reservation reset behavior when time reaches zero.

#### Order Summary Panel (`OrderSummaryPanel`)

- Appears during seat selection, ticket type selection, and checkout.
- Uses a sidebar layout on desktop and a bottom sheet layout on mobile.
- Shows seats, ticket types, unit prices, and total amount.

#### Checkout Step Indicator (`CheckoutStepIndicator`)

- Shows progress: Session → Seats → Ticket Types → Checkout → Confirmation.
- Highlights the current step.
- Visible during all purchase flow pages.

#### Purchase Flow Guard (`PurchaseFlowGuard`)

- Wraps `/ticket-types` and `/checkout` pages.
- Redirects to the last known session if `reservedSeats` is empty.
- Falls back to `/` with an explanatory message if no session context exists.

#### Admin Shell (`AdminShell`)

- Shared layout wrapper for all `/admin/*` pages.
- Provides sidebar navigation with links to all admin sections.
- Shows the active section highlighted.
- Accessible to staff and master users only.

#### Admin Table (`AdminTable`)

- Reusable table component for admin list views.
- Configurable columns with `AdminTableColumn` type.
- Used by genre, movie, room, session, pricing, and user list pages.

#### Admin Confirm Dialog (`AdminConfirmDialog`)

- Modal confirmation dialog for destructive actions.
- Accepts a title, message, and confirm/cancel callbacks.

#### Error Toast or Alert Banner

The frontend must map backend `error.code` values to user-friendly messages in the active locale.

| `error.code` | Default User Message (pt-BR) |
|---|---|
| `VALIDATION_FAILED` | "Verifique as informações fornecidas e tente novamente." |
| `INVALID_CREDENTIALS` | "E-mail ou senha incorretos." |
| `NOT_AUTHENTICATED` | "Sua sessão expirou. Faça login novamente." |
| `PERMISSION_DENIED` | "Você não tem permissão para realizar esta ação." |
| `RESOURCE_NOT_FOUND` | "O recurso solicitado não foi encontrado." |
| `SEAT_ALREADY_RESERVED` | "Este assento foi reservado por outro usuário. Escolha outro assento." |
| `INVALID_TICKET_TYPE` | "O tipo de ingresso selecionado é inválido." |
| `INVALID_PAYMENT_METHOD` | "O método de pagamento selecionado é inválido." |
| `THROTTLED` | "Muitas tentativas. Aguarde e tente novamente." |
| `INTERNAL_SERVER_ERROR` | "Ocorreu um erro inesperado. Tente novamente mais tarde." |
| `REVIEW_ALREADY_EXISTS` | "Você já avaliou este filme." |
| `CANNOT_VOTE_OWN_REVIEW` | "Você não pode votar na sua própria avaliação." |
| `LAST_MASTER_ADMIN` | "Não é possível remover o único administrador master." |
| `ROOM_LAYOUT_LOCKED` | "O layout desta sala não pode ser alterado pois existem sessões futuras." |

### 6.3 Seat Map

The seat map is derived from `GET /api/v1/reservation/sessions/{sessionId}/seats/`.

| API State | UI State | Behavior |
|---|---|---|
| `AVAILABLE` | Available | Selectable |
| `RESERVED` by current user | Selected | Can be released by current user |
| `RESERVED` by another user | Occupied | Disabled |
| `PURCHASED` | Occupied | Disabled |
| `is_accessible = true` | Accessible marker | Must include visual and semantic indication |

Rendering requirements:

- Render row labels alphabetically.
- Render seat numbers within each row.
- Include a screen indicator above the map.
- Include a legend for every state.
- Use buttons or button-like controls with accessible labels.
- Support keyboard navigation.

### 6.4 Checkout Step Indicator

The purchase flow must show progress across:

```text
Session -> Seats -> Ticket Types -> Checkout -> Confirmation
```

The order summary must stay available and synchronized during Seats, Ticket Types, and Checkout.

---

## 7. API Integration Contract

List endpoints are paginated by DRF with page size 10 and return:

```json
{
  "count": 0,
  "next": null,
  "previous": null,
  "results": []
}
```

The session seat map endpoint is not paginated.

### 7.1 Authentication

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| Register | `POST` | `/api/v1/auth/register/` | No |
| Login | `POST` | `/api/v1/auth/login/` | No |
| Refresh token | `POST` | `/api/v1/auth/token/refresh/` | No |
| Current user | `GET` | `/api/v1/users/me/` | Yes |

Login payload:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Login response:

```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

### 7.2 Catalog

| Operation | Method | Endpoint | Auth | Query Parameters |
|---|---|---|---|---|
| List movies | `GET` | `/api/v1/catalog/movies/` | No | `status`, `is_featured` |
| Get movie | `GET` | `/api/v1/catalog/movies/{id}/` | No | none |
| List sessions | `GET` | `/api/v1/catalog/sessions/` | No | `movie`, `date`, `start_from`, `start_to`, `experience_type`, `audio_format`, `projection_format`, `session_type` |
| Get session | `GET` | `/api/v1/catalog/sessions/{id}/` | No | none |

Relevant `Movie` fields:

- `id`
- `title`
- `genres` (list of `{ id, name }`)
- `synopsis`
- `duration_minutes`
- `release_date`
- `poster_url`
- `spotlight_url` (optional hero image for banners)
- `status` (`em_cartaz` | `pre_venda` | `em_breve`)
- `is_featured`
- `age_rating` (optional: `L` | `10` | `12` | `14` | `16` | `18`)
- `classification_description` (optional)
- `director` (optional)
- `cast` (list of `{ id, name, order }`)
- `created_at`
- `updated_at`

Relevant `Session` fields:

- `id`
- `movie`
- `room`
- `start_time`
- `end_time`
- `base_price`
- `audio_format`
- `projection_format`
- `session_type`
- `created_at`
- `updated_at`

Relevant nested `room` fields:

- `id`
- `name`
- `capacity`
- `experience_type`
- `display_name`
- `description`

Important contract notes:

- The session movie filter is named `movie`, not `movie_id`.
- `movie` expects a UUID.
- Movie `status` values are `em_cartaz`, `pre_venda`, and `em_breve`.
- Session metadata values are optional. Empty or missing metadata must not block session rendering.
- `experience_type` values are `standard`, `vip`, `premium`, and `imax`.
- `audio_format` values are `original`, `legendado`, and `dublado`.
- `projection_format` values are `2d`, `3d`, and `imax`.
- `session_type` values are `regular`, `preview`, and `special_event`.
- The current backend does not expose `age_rating` or `trailer_url`.
- `genres` is a list of `{ id, name }`.

### 7.3 Seat Map

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| Get session seat map | `GET` | `/api/v1/reservation/sessions/{session_id}/seats/` | No |

Relevant fields:

- `session_seat_id`
- `seat_id`
- `row`
- `number`
- `status`
- `is_accessible`
- `reserved_by_current_user` when the request is authenticated
- `lock_expires_at` when the reservation belongs to the current user

### 7.4 Temporary Reservation

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| Reserve seats | `POST` | `/api/v1/reservation/sessions/{session_id}/reservations/` | Yes |
| Release reservations | `DELETE` | `/api/v1/reservation/sessions/{session_id}/reservations/` | Yes |

Reserve payload:

```json
{
  "seat_ids": ["a6c9d2e1-0a0d-44c4-8f03-0b5d8c19c001"]
}
```

Release payload:

```json
{
  "session_seat_ids": ["d8e03f21-3dc2-4328-9e96-c32c75c60001"]
}
```

Reserve response:

- Status: `201 Created`
- Body includes `session_id`, `status`, `expires_at`, and `seats`.
- Each returned seat includes `seat_id`, `row`, `number`, and `status`.
- The frontend must preserve the original `session_seat_id` from the seat map for release and checkout.

Release response:

- Status: `200 OK`
- Body includes `session_id`, `status`, and released seats.

Conflict response:

- Status: `409 Conflict`
- Error code: `SEAT_ALREADY_RESERVED`

### 7.5 Checkout

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| Complete checkout | `POST` | `/api/v1/reservation/checkout/` | Yes |

Payload:

```json
{
  "seats": [
    {
      "session_seat_id": "d8e03f21-3dc2-4328-9e96-c32c75c60001",
      "ticket_type": "inteira"
    },
    {
      "session_seat_id": "d8e03f21-3dc2-4328-9e96-c32c75c60002",
      "ticket_type": "meia"
    }
  ],
  "payment_method": "pix"
}
```

Success response:

- Status: `200 OK`
- Body includes `status`, `payment_method`, `total_amount`, `seats`, and `tickets`.

The backend accepts optional `total_amount` validation, but the frontend must not send it by default.

### 7.6 Movie Reviews

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| List reviews | `GET` | `/api/v1/catalog/movies/{movieId}/reviews/` | Optional |
| Submit review | `POST` | `/api/v1/catalog/movies/{movieId}/reviews/` | Yes |
| Update own review | `PATCH` | `/api/v1/catalog/movies/{movieId}/reviews/{reviewId}/` | Yes (owner) |
| Delete own review | `DELETE` | `/api/v1/catalog/movies/{movieId}/reviews/{reviewId}/` | Yes (owner) |
| Vote on review | `POST` | `/api/v1/catalog/movies/{movieId}/reviews/{reviewId}/vote/` | Yes |
| Remove vote | `DELETE` | `/api/v1/catalog/movies/{movieId}/reviews/{reviewId}/vote/` | Yes |

Submit review payload:

```json
{
  "rating": 4.5,
  "comment": "Excelente filme, ótima cinematografia."
}
```

Review list response fields per item:

- `id`
- `user` (`{ id, username }`)
- `rating` (decimal string, e.g. `"4.5"`)
- `comment`
- `created_at`
- `updated_at`
- `vote_counts` (`{ like: number, dislike: number }`)
- `user_vote` (`"like"` | `"dislike"` | `null`) — present when request is authenticated

Query parameters: `page`, `rating` (integer filter).

Vote payload:

```json
{ "vote": "like" }
```

### 7.7 Movie Interest

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| Get interest status | `GET` | `/api/v1/catalog/movies/{movieId}/interest/` | Optional |
| Mark interest | `POST` | `/api/v1/catalog/movies/{movieId}/interest/` | Yes |
| Remove interest | `DELETE` | `/api/v1/catalog/movies/{movieId}/interest/` | Yes |

GET response:

```json
{
  "count": 142,
  "user_interested": true
}
```

`user_interested` is `null` for unauthenticated requests.

### 7.8 Room Type Pricing

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| List pricing | `GET` | `/api/v1/catalog/room-type-pricing/` | Admin |
| Get entry | `GET` | `/api/v1/catalog/room-type-pricing/{id}/` | Admin |
| Update entry | `PATCH` | `/api/v1/catalog/room-type-pricing/{id}/` | Admin |

PATCH payload:

```json
{ "base_price": "65.00" }
```

Response fields: `id`, `experience_type`, `base_price`, `updated_at`.

### 7.9 Admin Endpoints

The `src/api/admin.ts` module wraps additional admin-only endpoints.

**Admin summary:**

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| Get summary | `GET` | `/api/v1/admin/summary/` | Admin |

Returns `{ movieCount, nowShowingCount, roomCount, sessionsTodayCount }`.

**Bulk layout:**

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| Bulk create rows/seats | `POST` | `/api/v1/reservation/bulk-create-layout/` | Admin |

Payload:

```json
{
  "room": "<room_uuid>",
  "rows": [
    { "name": "A", "seats": [{ "number": 1 }, { "number": 2 }] }
  ]
}
```

**Accessible row:**

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| Create accessible row | `POST` | `/api/v1/reservation/accessible-row/` | Admin |

Payload:

```json
{
  "room": "<room_uuid>",
  "name": "PCD",
  "accessible_seat_count": 3
}
```

Creates 3 wheelchair-accessible seats each paired with a companion seat.

**User management:**

| Operation | Method | Endpoint | Auth |
|---|---|---|---|
| List users | `GET` | `/api/v1/users/?role=<filter>` | Master |
| Grant role | `POST` | `/api/v1/users/{userId}/admin/` | Master |
| Revoke role | `DELETE` | `/api/v1/users/{userId}/admin/` | Master |
| Permission logs | `GET` | `/api/v1/users/{userId}/admin/logs/` | Master |
| Delete user | `DELETE` | `/api/v1/users/{userId}/` | Master |

Grant payload: `{ "role": "staff" }` or `{ "role": "master" }`.

### 7.10 My Tickets

| Operation | Method | Endpoint | Auth | Query Parameters |
|---|---|---|---|---|
| List my tickets | `GET` | `/api/v1/users/me/tickets/` | Yes | `type=upcoming|past` |

Relevant ticket fields:

- `ticket_id`
- `ticket_code`
- `ticket_type`
- `amount_paid`
- `payment_method`
- `created_at`
- `movie`
- `session`
- `room`
- `seat`

Expected nested shape:

```json
{
  "ticket_id": "uuid",
  "ticket_code": "CODE",
  "ticket_type": "inteira",
  "amount_paid": "42.00",
  "payment_method": "pix",
  "movie": {
    "id": "uuid",
    "title": "Movie title",
    "poster_url": "https://example.com/poster.jpg"
  },
  "session": {
    "id": "uuid",
    "start_time": "2026-05-21T20:00:00Z",
    "end_time": "2026-05-21T22:00:00Z"
  },
  "room": {
    "id": "uuid",
    "name": "Room 1"
  },
  "seat": {
    "id": "uuid",
    "row": "A",
    "number": 1,
    "identifier": "A1"
  }
}
```

---

## 8. State Management Strategy

### 8.1 Authentication State

Global authentication state must contain:

| Field | Type | Description |
|---|---|---|
| `accessToken` | `string \| null` | In-memory access token |
| `refreshToken` | `string \| null` | In-memory refresh token |
| `user` | `User \| null` | Current authenticated user |
| `isAuthenticated` | `boolean` | Derived authentication flag |

Required actions:

- `login()`: stores tokens and current user data.
- `logout()`: clears tokens, user data, and protected state.
- `refreshAccess()`: refreshes the access token after a `401`.

### 8.2 Reservation State

Reservation state must survive navigation between purchase steps but does not need to survive a full page reload.

| Field | Type | Description |
|---|---|---|
| `sessionId` | `string \| null` | Selected session UUID |
| `reservedSeats` | `ReservedSeat[]` | Seats reserved by the current user |
| `ticketTypes` | `Record<sessionSeatId, TicketType>` | Selected ticket type per reserved seat |
| `paymentMethod` | `'cartao_credito' \| 'pix' \| null` | Selected payment method |
| `reservationExpiresAt` | `Date \| null` | Expiration timestamp from the backend |

Each `ReservedSeat` must include:

- `sessionSeatId`
- `seatId`
- `row`
- `number`
- `isAccessible`
- `basePrice`
- `expiresAt`

Required actions:

- `addSeats(seats)`
- `removeSeat(sessionSeatId)`
- `setTicketType(sessionSeatId, type)`
- `setPaymentMethod(method)`
- `resetReservation()`

Total calculation:

```ts
sum(
  seats.map((seat) =>
    seat.basePrice * (ticketTypes[seat.sessionSeatId] === "meia" ? 0.5 : 1)
  )
)
```

### 8.3 Page State

Page-specific data such as movie lists, session lists, and seat maps may be stored locally with React state/effects or through a data-fetching library such as SWR or React Query if added intentionally.

### 8.4 Purchase Flow Guards

In addition to authentication, `/ticket-types` and `/checkout` require an active reservation. If the user opens those routes without `reservedSeats`, the app must redirect to the last known session when possible. Otherwise, it must redirect to `/` with a clear message.

The `/confirmation` page may render tickets stored in memory immediately after checkout. If the page is reloaded and confirmation state is lost, it must guide the user to `/my-tickets`.

---

## 9. Non-Functional Requirements

### NFR-01 Performance

- The home page should become interactive within 3 seconds on a standard broadband connection.
- API loading states must use skeletons or spinners.
- Poster images must be lazy-loaded and responsive.
- Route-level code splitting must avoid unnecessary initial JavaScript.

### NFR-02 Accessibility

- Seat states must not rely on color alone.
- Accessible seats must be visually and semantically identified.
- Seat controls must be keyboard-navigable.
- Seat controls must include useful accessible labels.
- Form inputs must have labels and linked validation messages.
- Main flows should meet WCAG 2.1 AA expectations.

### NFR-03 Responsiveness

- The app must work on desktop viewports of 1024px and wider.
- The app must work on mobile viewports of 375px and wider.
- The order summary must become a mobile-friendly bottom sheet on small screens.
- Seat maps may scroll horizontally on narrow screens without losing functionality.

### NFR-04 Reliability and Feedback

- The countdown must align with backend `expires_at`.
- Network errors must show retry-friendly feedback.
- Recoverable API failures must preserve the current flow state where possible.
- Expired reservations must reset the reservation state and explain what happened.

### NFR-05 Client Security

- JWT tokens must not be stored in `localStorage` or `sessionStorage`.
- Access and refresh tokens are stored in memory in the current implementation.
- Refresh token storage may move to `httpOnly` cookies only if backend support is added.
- Protected pages must not flash authenticated content before redirecting.
- Sensitive values such as tokens or email addresses must not be placed in URLs.

### NFR-06 Localization

- Supported locales are `pt-BR` and `en-US`; `pt-BR` is the fallback locale.
- Users must be able to switch language from the UI. The selected language is
  persisted with the `cineprime_locale` cookie and applied to `<html lang>`,
  metadata, route content, accessible labels, API requests, and formatting.
- The frontend sends the selected locale with `Accept-Language`. Catalog APIs
  may also accept a `locale` query parameter, which takes precedence over the
  header.
- User-facing UI text, navigation, forms, states, admin screens, checkout,
  tickets, accessibility text, and backend error-code messages must come from
  locale dictionaries with field-level fallback to `pt-BR`.
- Dates, times, currency values, enum labels, payment labels, ticket type
  labels, session metadata labels, and pluralized strings must follow the active
  locale.
- Catalog admin screens manage translated movie title/synopsis, genre names,
  and room display name/description through the backend `translations` object.

---

## 10. Security and Access Control

### 10.1 Route Guards

**Authentication-protected routes** (redirect to `/login?redirect=<url>` if not authenticated):

- `/ticket-types`
- `/checkout`
- `/confirmation`
- `/my-tickets`

The seat map route `/sessions/{sessionId}/seats` is public for viewing, but reservation and release actions require authentication. If a visitor attempts a protected action, redirect to `/login?redirect=<current_url>`.

**Admin-protected routes** (redirect to `/` if not staff or master):

- `/admin/*` — guarded by `AdminRoute`

**Master-protected routes** (redirect to `/admin/` if staff but not master):

- `/admin/users/` — additionally guarded by `MasterRoute`

### 10.2 Token Handling

| Event | Behavior |
|---|---|
| Successful login | Store `access` and `refresh` in memory |
| Protected request | Attach `Authorization: Bearer <access>` |
| `401` response | Try silent refresh through `/api/v1/auth/token/refresh/` |
| Refresh success | Retry the original request |
| Refresh failure | Clear auth state and redirect to login |
| Explicit logout | Clear auth and reservation state, then redirect to `/` |

### 10.3 TMDB Token Security

The TMDB token is never sent to or stored in the browser. The Next.js proxy (`src/app/api/tmdb/get-token.ts`) resolves the token server-side only. The `INTERNAL_API_KEY` shared secret must be kept in server-only environment variables and must never be referenced in `NEXT_PUBLIC_*` variables or client-side code.

### 10.4 Price Manipulation Protection

The frontend must not trust its own price calculation as authoritative. It displays totals for user clarity only. Checkout must send only `session_seat_id`, `ticket_type`, and `payment_method`; the backend calculates and validates final prices.

---

## 11. Testing Requirements

### 11.1 Unit and Component Tests

Current test stack:

- Node.js test runner
- `tsx`

Required unit coverage:

- API base URL resolution.
- Error code to user message mapping.
- Ticket total calculation.
- Countdown expiration calculation.
- Reservation state transitions.

When real UI components are implemented, add Testing Library coverage for:

- Seat state rendering.
- Seat selection interactions.
- Form validation display.
- Order summary updates.

### 11.2 Integration Tests

Required integration coverage:

- Home -> movie detail -> seat selection -> ticket types -> checkout -> confirmation using mocked API.
- Login and redirect back to the originally requested route.
- Reservation expiration reset.
- Failed reservation lock handling.

### 11.3 End-to-End Tests

When Playwright or Cypress is added, required E2E scenarios:

- Register -> log in -> purchase ticket.
- Attempt to reserve an already reserved seat.
- Visit protected route while unauthenticated.
- Let a reservation expire and verify reset behavior.

### 11.4 CI Requirements

The frontend CI workflow must run:

1. `npm ci`
2. `npm run lint`
3. `npm run test`
4. `npx playwright install --with-deps chromium`
5. `npm run e2e:ci`
6. `npm run build`

---

## 12. Operational Requirements

### 12.1 Environment Variables

| Variable | Scope | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Browser (build-time) | Backend REST API base URL compiled into browser code | `http://localhost:8000` |
| `TMDB_API_READ_TOKEN` | Server-only (runtime) | TMDB token used directly by the proxy; takes priority over the database-stored token; optional if `INTERNAL_API_KEY` is configured | `eyJhbGci...` |
| `INTERNAL_API_KEY` | Server-only (runtime) | Shared secret for server-to-server calls between Next.js and Django (`X-Internal-Key` header); required for database-backed TMDB token retrieval; must match `INTERNAL_API_KEY` in the Django backend | `super-secret-key` |
| `BACKEND_INTERNAL_URL` | Server-only (runtime) | Internal hostname for Next.js → Django server-to-server calls (Docker-only); falls back to `NEXT_PUBLIC_API_BASE_URL` | `http://backend:8000` |

### 12.2 Local Commands

```bash
cd frontend
npm ci
npm run dev
npm run lint
npm run test
npm run e2e:ci
npm run build
```

The development server runs on `http://localhost:3000`.

### 12.3 Docker and Deployment

- The default frontend Dockerfile is production-oriented, multi-stage, installs with `npm ci`, runs `npm run build`, and uses a minimal Next.js standalone runtime.
- The root `docker-compose.yml` keeps local development on `Dockerfile.dev`, mounts the frontend directory, and injects `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.
- Production Docker builds must pass `NEXT_PUBLIC_API_BASE_URL` as a build argument because public Next.js variables are compiled into browser assets.
- The production container starts with the Next.js standalone runtime command `node server.js`.
- Static CDN or Nginx-only hosting should be used only if the project is explicitly configured for static export.

---

## 13. Requirements Traceability Matrix

| Requirement | Frontend Artifact |
|---|---|
| FE-01 Home Page | `src/app/page.tsx`, `src/app/HomeCatalog.tsx`, `src/components/movies/FeaturedMovieBanner.tsx`, `src/components/movies/MovieGrid.tsx`, `src/components/movies/TabbedMovieCatalog.tsx`, `src/components/movies/HomeSchedule.tsx`, `src/api/catalog.ts` |
| FE-02 Movie Detail | `src/app/movies/[movieId]/page.tsx`, `src/components/movies/MovieDetail.tsx`, `src/components/movies/SessionBadges.tsx`, `src/components/movies/session-selection.ts` |
| FE-03 Seat Selection | `src/app/sessions/[sessionId]/seats/page.tsx`, `src/components/seats/SeatMap.tsx`, `src/components/seats/SeatSelectionActions.tsx`, `src/hooks/useReservationCountdown.ts`, `src/api/reservation.ts` |
| FE-04 Ticket Type Selection | `src/app/ticket-types/page.tsx`, `src/components/reservations/TicketTypeSelection.tsx`, `src/components/reservations/OrderSummaryPanel.tsx`, `src/components/reservations/ticket-type-selection.ts` |
| FE-05 Checkout | `src/app/checkout/page.tsx`, `src/components/reservations/CheckoutReview.tsx`, `src/components/reservations/checkout-flow.ts`, `src/api/checkout.ts` |
| FE-06 Confirmation and My Tickets | `src/app/confirmation/page.tsx`, `src/components/reservations/CheckoutConfirmation.tsx`, `src/app/my-tickets/page.tsx`, `src/components/tickets/TicketCard.tsx`, `src/components/tickets/MyTicketsClient.tsx`, `src/api/tickets.ts` |
| FE-07 Authentication | `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`, `src/api/auth.ts`, `src/contexts/AuthContext.tsx`, `src/contexts/auth-state.ts`, `src/contexts/auth-persistence.ts` |
| FE-08 Admin UI | `src/app/admin/**`, `src/components/admin/**`, `src/api/admin.ts`, `src/components/auth/AdminRoute.tsx`, `src/components/auth/MasterRoute.tsx` |
| FE-09 TMDB Integration | `src/app/api/tmdb/movie/[id]/route.ts`, `src/app/api/tmdb/search/route.ts`, `src/components/admin/AdminMovieForm.tsx` |
| FE-10 Movie Reviews | `src/api/reviews.ts`, `src/components/movies/MovieReviews.tsx`, `src/components/movies/StarRating.tsx`, `src/components/admin/AdminMovieReviewList.tsx` |
| FE-11 Movie Interest | `src/api/interest.ts`, `src/components/movies/MovieDetail.tsx` |
| FE-12 Language Switcher | `src/components/layout/LanguageSwitcher.tsx`, `src/i18n/I18nProvider.tsx`, `src/i18n/locales.ts`, `src/i18n/messages.ts` |
| Accessibility | `src/components/seats/SeatMap.tsx`, all form components |
| Reservation Expiration | `src/hooks/useReservationCountdown.ts`, `src/utils/reservation-countdown.ts`, `src/contexts/ReservationContext.tsx` |
| Client Security | `src/api/client.ts`, `src/contexts/AuthContext.tsx`, `src/contexts/auth-state.ts` |
| Reservation Conflict | `src/components/seats/SeatMap.tsx` (optimistic revert on 409) |
| Purchase Flow Guards | `src/components/reservations/PurchaseFlowGuard.tsx`, `src/components/reservations/purchase-flow-guards.ts` |
| Route Guards | `src/components/auth/ProtectedRoute.tsx`, `src/components/auth/AdminRoute.tsx`, `src/components/auth/MasterRoute.tsx`, `src/components/auth/route-guards.ts` |
| Checkout Step Indicator | `src/components/reservations/CheckoutStepIndicator.tsx`, `src/components/reservations/checkout-steps.ts` |
| Order Summary | `src/components/reservations/OrderSummaryPanel.tsx`, `src/components/reservations/order-summary.ts` |
| i18n | `src/i18n/**`, `src/utils/formatters.ts` |

---

## 14. Out of Scope

- Real payment gateway processing (Stripe, PagSeguro, Mercado Pago, etc.).
- Native iOS or Android applications.
- Loyalty program, cashback, or real coupon validation beyond the voucher input field.
- Concession / bomboniére ordering.
- Real QR code validation at physical entrance.
- Movie trailer playback (`trailer_url` is not exposed by the backend).
- Review moderation or flagging UI beyond what Django admin provides.
- Multi-tenant or franchise cinema chain support.
- Server-side rendering (SSR) for authenticated or personalized content — the app uses client-side data fetching; Next.js SSR is only used for static or public pages where naturally applicable.
