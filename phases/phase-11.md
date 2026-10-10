# Phase 11 — Later features: event management and ticketing, donations and fundraising

| | |
|---|---|
| **When** | **After the hackathon.** Not part of the 12-hour budget. Estimated 6–10 hours including testing |
| **Goal** | Alumni engagement features from your "Later Features" list: create and track reunions, regional chapter meets and webinars with RSVPs and paid tickets (QR check-in); a secure donation and fundraising gateway for campus infrastructure, research projects and scholarships |
| **Prerequisites** | The core product (Phases 00–10) deployed; a payment gateway account in **test mode**; written approval from the college before any real money moves |
| **PRD features** | F47 Event management and ticketing, F48 Donation and fundraising gateway (F37 Success stories was pulled forward into Phase 08) |
| **Requirements** | FR-EVT-1…2, FR-DON-1…2, FR-LEGAL-1 |

> ⚠️ **Read before building.**
> - Payment provider APIs change. This guide uses **Razorpay** (common in India) and describes its usual flow: create an *order* on the server → open *Checkout* on the client → verify the *signature* on the server → confirm with a *webhook*. **Check Razorpay's current documentation** for exact endpoints, SDK method names, script URLs and signature formats before coding.
> - **Donations and ticket sales involve legal and financial obligations** (who receives the money, tax receipts such as 80G certificates, accounting, refunds, possibly rules for foreign contributions). These must be owned by the college or a registered entity. **Get approval and verify the requirements with the college's finance office before taking real payments.** Until then, run everything in test mode and label it clearly.

---

## 1. What you will build

### Event management (F47)
- Admins (and approved alumni chapter leads, optional) create **community events**: reunions, regional chapter meets, webinars — title, description, cover image, date/time, venue or online link, region/chapter, capacity, free or paid (ticket price), registration deadline.
- Public **/events** page (upcoming and past), filters by type and region; event detail page.
- **RSVP** for free events; **buy a ticket** for paid events (test mode).
- **Tickets** with a unique code and **QR code**; "My tickets" page.
- **Admin tracking:** registrations, revenue (test), capacity bar, attendee list, CSV export, **check-in** by scanning or entering the ticket code.
- Notifications: confirmation, reminder 1 day before (scheduled job), event updates.

### Donations and fundraising (F48)
- Admins create **campaigns**: category (Infrastructure · Research · Scholarships), title, story, cover image, goal amount, end date, status.
- Public **/give** page with campaign cards (progress bars, raised/goal, donors count, days left); campaign detail page with story, updates and donor wall.
- **Donate** with preset amounts or custom amount, optional message, "donate anonymously" option; payment in test mode.
- **Receipts**: on-screen receipt and a downloadable PDF/HTML receipt with a receipt number; tax-receipt fields only after the college confirms its registration details.
- **Admin:** campaign management, donations list, totals, CSV export, refunds marked manually (or via the gateway's refund API later).
- **Spotlight integration:** link campaigns from success stories ("This scholarship helped Meera…").

---

## 2. Architecture for payments

```
Browser                         API (Express)                         Razorpay (test mode)
  │ 1. Click "Buy ticket" / "Donate"
  │ ───────────────────────────▶ 2. Validate, compute amount on the SERVER,
  │                                  create Payment(PENDING) + order ──────────▶ create order
  │ ◀─────────────────────────── 3. { orderId, amount, keyId, prefill }
  │ 4. Open Checkout (gateway's script)
  │ ─────────────────────────────────────────────────────────────────────────▶ user pays (test card/UPI)
  │ ◀───────────────────────────────────────────────────────────────────────── { payment_id, order_id, signature }
  │ 5. POST /payments/verify ──▶ 6. Verify signature (HMAC with key secret),
  │                                  mark Payment PAID, issue ticket / record donation (idempotent)
  │ ◀─────────────────────────── 7. { ticket | receipt }
  │                              8. Webhook (payment.captured / failed) ◀────── gateway calls API
  │                                  verify webhook signature on the RAW body, update Payment (idempotent)
```

**Rules**
- The **server** decides the amount (ticket price × quantity, or the validated donation amount). Never trust an amount sent by the client for order creation without validation.
- Payments are **idempotent**: verifying the same payment twice, or receiving the webhook before/after the verify call, must not create two tickets or two donations (unique constraints on gateway ids).
- Store amounts in **paise** (integers), never floats.
- Webhooks need the **raw request body** for signature verification — mount that route with `express.raw({ type: 'application/json' })` **before** `express.json()`.

---

## 3. Data model additions

Add with a new migration (`npx prisma migrate dev --create-only --name events_and_giving`; review the SQL; remove any `DROP INDEX` for search indexes; apply).

```prisma
enum EventKind {
  CAMPUS          // This Week items (existing usage)
  REUNION
  CHAPTER_MEET
  WEBINAR
}

enum TicketStatus {
  RESERVED        // RSVP for free events
  PENDING_PAYMENT
  CONFIRMED
  CHECKED_IN
  CANCELLED
}

enum PaymentStatus {
  CREATED
  PAID
  FAILED
  REFUNDED
}

enum PaymentPurpose {
  TICKET
  DONATION
}

enum CampaignCategory {
  INFRASTRUCTURE
  RESEARCH
  SCHOLARSHIP
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  CLOSED
}

// Extend the existing Event model with these fields:
//   kind            EventKind  @default(CAMPUS)
//   slug            String?    @unique
//   coverUrl        String?
//   region          String?    // chapter / city
//   isOnline        Boolean    @default(false)
//   capacity        Int?
//   priceInPaise    Int        @default(0)
//   registrationEnd DateTime?
//   published       Boolean    @default(true)
//   tickets         EventTicket[]

model EventTicket {
  id          String       @id @default(uuid())
  eventId     String
  userId      String
  quantity    Int          @default(1)
  status      TicketStatus @default(RESERVED)
  code        String       @unique // short, unguessable (e.g. 10 chars base32)
  amountPaise Int          @default(0)
  paymentId   String?      @unique
  checkedInAt DateTime?
  createdAt   DateTime     @default(now())

  event   Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  payment Payment? @relation(fields: [paymentId], references: [id])

  @@unique([eventId, userId]) // one registration per person per event (quantity covers guests)
}

model Campaign {
  id            String           @id @default(uuid())
  slug          String           @unique
  category      CampaignCategory
  title         String
  summary       String
  story         String
  coverUrl      String?
  goalPaise     Int
  raisedPaise   Int              @default(0)
  donorCount    Int              @default(0)
  endsAt        DateTime?
  status        CampaignStatus   @default(DRAFT)
  updates       Json             @default("[]") // [{ date, text }]
  createdAt     DateTime         @default(now())
  donations     Donation[]
}

model Donation {
  id          String   @id @default(uuid())
  campaignId  String
  userId      String?
  amountPaise Int
  message     String   @default("")
  anonymous   Boolean  @default(false)
  receiptNo   String   @unique
  paymentId   String   @unique
  createdAt   DateTime @default(now())

  campaign Campaign @relation(fields: [campaignId], references: [id])
  user     User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  payment  Payment  @relation(fields: [paymentId], references: [id])
}

model Payment {
  id               String         @id @default(uuid())
  purpose          PaymentPurpose
  userId           String?
  amountPaise      Int
  currency         String         @default("INR")
  status           PaymentStatus  @default(CREATED)
  gatewayOrderId   String         @unique
  gatewayPaymentId String?        @unique
  meta             Json           @default("{}") // { eventId, quantity } or { campaignId, message, anonymous }
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  ticket   EventTicket?
  donation Donation?
}
```

Add the back-relations on `User` (`tickets EventTicket[]`, `donations Donation[]`). The existing This Week code keeps working: set `kind = CAMPUS` for existing events (default) and exclude non-CAMPUS kinds from This Week if you prefer (Phase 05 already excludes REUNION and CHAPTER_MEET by category).

---

## 4. API

### 4.1 Environment

```
RAZORPAY_KEY_ID=rzp_test_…        # test key id (safe to send to the browser)
RAZORPAY_KEY_SECRET=…             # server only
RAZORPAY_WEBHOOK_SECRET=…         # server only, set when creating the webhook in the dashboard
PAYMENTS_ENABLED=true             # feature flag
```

```bash
npm i razorpay qrcode -w apps/api     # ⚠️ check package names and APIs
npm i -D @types/qrcode -w apps/api
```

### 4.2 Endpoints

| Method | Path | Guard | Purpose |
|---|---|---|---|
| GET | `/events?kind=&region=&when=upcoming\|past` | public | Community events list |
| GET | `/events/:slug` | public | Event detail + seats left + my ticket (if signed in) |
| POST | `/events/:slug/rsvp` | 🎓 | Free event: create RESERVED ticket (capacity check in a transaction) |
| POST | `/events/:slug/checkout` | 🎓 | Paid event: `{ quantity }` → create Payment + gateway order → `{ orderId, amount, keyId }` |
| DELETE | `/events/:slug/rsvp` | 🎓 | Cancel a free RSVP |
| GET | `/me/tickets` | 🎓 | My tickets with QR data URLs |
| GET | `/campaigns` | public | Active campaigns |
| GET | `/campaigns/:slug` | public | Campaign + donor wall (anonymous donors shown as "Anonymous") |
| POST | `/campaigns/:slug/checkout` | 🎓 | `{ amountPaise (min 100 rupees = 10000 paise, max per policy), message?, anonymous }` → order |
| POST | `/payments/verify` | 🎓 | `{ orderId, paymentId, signature }` → verify → fulfil → ticket or receipt |
| POST | `/payments/webhook` | gateway (raw body) | Verify webhook signature → update payment → fulfil if needed |
| GET | `/me/donations` | 🎓 | My donations + receipts |
| GET | `/donations/:receiptNo/receipt` | 🎓 (owner) or 🛡️ | Receipt (HTML for print-to-PDF) |
| CRUD | `/admin/community-events[/:id]` | 🛡️ | Manage reunions/meets/webinars |
| GET | `/admin/community-events/:id/attendees` | 🛡️ | Attendee list + CSV export (`?format=csv`) |
| POST | `/admin/checkin` | 🛡️ | `{ code }` → mark CHECKED_IN (idempotent; returns attendee) |
| CRUD | `/admin/campaigns[/:id]` | 🛡️ | Manage campaigns, post updates |
| GET | `/admin/donations?campaignId=` | 🛡️ | Donations list + totals + CSV |

### 4.3 Key implementation details

**Creating an order (server):**

```ts
import Razorpay from 'razorpay'; // ⚠️ check import style and method names in the current SDK docs
const rzp = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });

export async function createOrder(purpose: 'TICKET' | 'DONATION', userId: string, amountPaise: number, meta: object) {
  const payment = await prisma.payment.create({ data: { purpose, userId, amountPaise, gatewayOrderId: `pending_${randomUUID()}`, meta } });
  const order = await rzp.orders.create({ amount: amountPaise, currency: 'INR', receipt: payment.id, notes: { purpose, paymentId: payment.id } });
  await prisma.payment.update({ where: { id: payment.id }, data: { gatewayOrderId: order.id } });
  return { orderId: order.id, amount: amountPaise, currency: 'INR', keyId: env.RAZORPAY_KEY_ID };
}
```

**Verifying the checkout signature (server):** the usual scheme is an HMAC-SHA256 of `orderId + "|" + paymentId` with the key secret, compared to the returned signature using a timing-safe comparison ⚠️ (confirm the exact format in the docs):

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

**Webhook (server):** mount before `express.json()`:

```ts
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.header('x-razorpay-signature') ?? ''; // ⚠️ confirm header name
  const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest('hex');
  if (!safeEqual(expected, signature)) return res.status(400).end();
  const event = JSON.parse(req.body.toString('utf8'));
  await handleGatewayEvent(event); // idempotent: upsert by gatewayPaymentId / gatewayOrderId
  res.json({ ok: true });
});
```

Also exclude this route from `jsonOnly` and from `helmet`-irrelevant concerns; respond quickly (do heavy work after responding if needed).

**Fulfilment (idempotent, one function used by both verify and webhook):**

```ts
export async function fulfil(orderId: string, gatewayPaymentId: string) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { gatewayOrderId: orderId } });
    if (!p) throw notFound();
    if (p.status === 'PAID') return p; // already fulfilled
    const paid = await tx.payment.update({ where: { id: p.id }, data: { status: 'PAID', gatewayPaymentId } });
    if (p.purpose === 'TICKET') {
      const { eventId, quantity } = p.meta as { eventId: string; quantity: number };
      await tx.eventTicket.upsert({
        where: { eventId_userId: { eventId, userId: p.userId! } },
        update: { status: 'CONFIRMED', paymentId: p.id, amountPaise: p.amountPaise, quantity },
        create: { eventId, userId: p.userId!, quantity, status: 'CONFIRMED', paymentId: p.id, amountPaise: p.amountPaise, code: ticketCode() },
      });
      await notify(tx, { userId: p.userId!, type: 'SYSTEM', title: 'Your ticket is confirmed', link: '/me/tickets' });
    } else {
      const { campaignId, message, anonymous } = p.meta as { campaignId: string; message: string; anonymous: boolean };
      await tx.donation.create({ data: { campaignId, userId: p.userId, amountPaise: p.amountPaise, message, anonymous, paymentId: p.id, receiptNo: await nextReceiptNo(tx) } });
      await tx.campaign.update({ where: { id: campaignId }, data: { raisedPaise: { increment: p.amountPaise }, donorCount: { increment: 1 } } });
      await notify(tx, { userId: p.userId!, type: 'SYSTEM', title: 'Thank you for your gift 💛', link: '/me/donations' });
    }
    return paid;
  });
}
```

**Capacity:** check `sum(quantity)` of RESERVED/CONFIRMED/PENDING tickets inside the same transaction as creating the RSVP or order; reject when full. Expire unpaid PENDING reservations after 15 minutes (a cleanup job or check `createdAt` when counting).

**Ticket codes and QR:** `ticketCode()` = 10 characters from a cryptographically random base32 alphabet. QR encodes only the code (or a check-in URL `https://<site>/admin/checkin?code=…`), generated with the `qrcode` package as a data URL when listing tickets.

**Reminders:** a daily job (Render Cron Job or a scheduled GitHub Action hitting a protected endpoint) notifies ticket holders of events happening tomorrow.

**Receipts:** sequential receipt numbers (`BU-2026-000123`) generated inside the transaction (a `ReceiptCounter` table or `SELECT max(...)` with a lock). The receipt page shows donor name (or "Anonymous" publicly, real name on the donor's own receipt), amount, date, campaign, payment reference, and — **only once confirmed by the college** — the registered entity's details and tax-exemption information.

---

## 5. Web

| Page | Route | UI |
|---|---|---|
| Events | `/events` | Tabs Upcoming / Past; filters type (Reunion · Chapter meet · Webinar) and region; event cards with cover, date block (day + month), title, location/online pill, price ("Free" or ₹), seats left bar, "Registered" badge |
| Event detail | `/events/:slug` | Cover hero, date/time with "Add to calendar" (.ics download), venue map link or online link (revealed after registering), description, host, attendee avatars (who opted to show), capacity bar, **RSVP** / **Buy ticket** (quantity stepper, price summary), cancel RSVP |
| Checkout | (modal) | Load the gateway Checkout script on demand; open with order id, amount, name, prefill email; on success call `/payments/verify`; on dismiss show "Payment cancelled" |
| My tickets | `/me/tickets` | Ticket cards with event, date, QR code, code text, status (Confirmed / Checked in), "Add to calendar" |
| Give | `/give` | Hero "Give back to the campus that shaped you"; category tabs; campaign cards (cover, category pill, title, summary, progress bar with "₹2.4L of ₹5L", donors, days left) |
| Campaign | `/give/:slug` | Story (comfortable reading), progress card (sticky on desktop) with preset amounts (₹500 · ₹1,000 · ₹2,500 · ₹5,000 · custom), message, anonymous switch, **Donate**; updates timeline; donor wall (name or "Anonymous", amount optional per policy, message) |
| Thank you / receipt | `/give/receipt/:receiptNo` | Thank-you message, receipt details, **Print / Save as PDF** (print stylesheet) |
| My donations | `/me/donations` | List with receipts |
| Admin → Community events | `/admin/events-community` | Create/edit form (all fields), registrations table, revenue (test), CSV export, **Check-in** screen: large input for code + optional camera scanner (⚠️ choose a maintained QR scanning library and check its docs), success state with attendee name |
| Admin → Campaigns | `/admin/campaigns` | Create/edit, post updates, donations table, totals, CSV export |

Sidebar: add **Events** and **Give back** to the Campus group (remove the "Coming next" cards added in Phase 10).

Design notes: use the warm amber accent for giving (gratitude), indigo for events; always show **"Test mode — no real money is charged"** banners until payments are approved and switched to live keys.

---

## 6. Security and compliance checklist

- [ ] Amounts computed/validated on the server; min/max donation limits enforced.
- [ ] Checkout signature verified on the server with a timing-safe comparison.
- [ ] Webhook signature verified on the **raw** body; webhook route excluded from JSON parsing and the JSON-only middleware.
- [ ] Fulfilment idempotent (unique `gatewayOrderId`, `gatewayPaymentId`, ticket per user per event).
- [ ] Key secret and webhook secret never sent to the browser or logged.
- [ ] Test-mode banner visible; live keys only after written approval.
- [ ] Refund and cancellation policy page written and linked (with the college).
- [ ] Tax receipt wording and registration details provided and approved by the college's finance office.
- [ ] Personal data in donations (names, amounts) visible only as the donor chooses (anonymous option respected everywhere, including CSV exports shared outside admins).

---

## 7. Manual tests (test mode)

| # | Steps | Expected result |
|---|---|---|
| 11.1 | Admin creates a free webinar (capacity 2) | Appears on `/events` with "2 seats left" |
| 11.2 | Two users RSVP; a third tries | Third sees "Event is full" |
| 11.3 | Admin creates a paid reunion (₹500); a user buys 2 tickets with a test payment method | Ticket confirmed (quantity 2, ₹1,000); QR on `/me/tickets`; notification |
| 11.4 | Call `/payments/verify` twice with the same payload | One ticket only |
| 11.5 | Send the webhook for the same payment (from the dashboard's test webhook tool) | Still one ticket; payment PAID |
| 11.6 | Tamper with the signature in `/payments/verify` | 400; nothing fulfilled |
| 11.7 | Admin check-in with the ticket code twice | First: Checked in; second: "Already checked in at 18:04" |
| 11.8 | Admin creates a scholarship campaign (goal ₹1,00,000); user donates ₹2,500 anonymously | Progress updates; donor wall shows "Anonymous"; donor's receipt shows their name and a receipt number |
| 11.9 | Donate below the minimum via the API | 400 |
| 11.10 | Export donations CSV | Totals match; anonymous rules respected |
| 11.11 | Dismiss the Checkout popup | "Payment cancelled"; Payment stays CREATED; no ticket/donation |

---

## 8. Rollout plan

1. Build and test everything in **test mode**.
2. Demo it to the alumni office / finance office with the test banner.
3. Get written approval: receiving account, entity name, tax receipt details, refund policy, data handling.
4. Switch to live keys behind `PAYMENTS_ENABLED`, start with a single small campaign or event, and monitor payments and webhooks closely.
