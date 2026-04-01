# Salon Booking — WhatsApp + Dashboard

A WhatsApp booking system for a barbershop. Clients book appointments through WhatsApp; the salon owner manages bookings through a web dashboard.

## Stack

- **Backend**: Node.js 22.12+ + Express
- **Database**: SQLite via built-in `node:sqlite` (no native compilation)
- **WhatsApp**: Twilio WhatsApp API (sandbox or production)
- **Frontend**: Vanilla HTML/CSS/JS dashboard

---

## Local development

### 1. Install dependencies

```bash
cd salon-booking
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default: 3000) |
| `TWILIO_ACCOUNT_SID` | From your Twilio console |
| `TWILIO_AUTH_TOKEN` | From your Twilio console |
| `TWILIO_WHATSAPP_FROM` | e.g. `whatsapp:+14155238886` (sandbox number) |
| `SALON_NAME` | Displayed in messages |
| `SALON_OPENING_HOUR` | e.g. `9` |
| `SALON_CLOSING_HOUR` | e.g. `18` |
| `SALON_SLOT_MINUTES` | Slot size in minutes, e.g. `30` |
| `DB_PATH` | *(optional)* Absolute path to `salon.db`. Defaults to project root. |

### 3. Start the server

```bash
npm start        # production
npm run dev      # with --watch (auto-restart on changes)
```

Dashboard: [http://localhost:3000](http://localhost:3000)

### 4. Expose the webhook locally (Twilio sandbox)

Twilio needs a public URL to deliver inbound WhatsApp messages. Use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g. `https://abc123.ngrok.io`) and set it in your Twilio console:

> **Twilio Console → Messaging → Try it out → Send a WhatsApp message**
> Sandbox webhook URL: `https://abc123.ngrok.io/webhook`

Then send `join <sandbox-keyword>` to the sandbox number from your WhatsApp to opt in.

---

## Deploy to Railway

### Prerequisites

- A [Railway](https://railway.app) account
- Your Twilio credentials

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/salon-booking.git
git push -u origin main
```

### Step 2 — Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → pick `salon-booking`
3. Railway auto-detects Node.js and runs `npm start`

### Step 3 — Add a persistent volume (required for SQLite)

Railway containers are ephemeral — the database file would be lost on every deploy without a volume.

1. In your Railway service → **Settings → Volumes**
2. Click **Add Volume**
3. Set the mount path to `/data`
4. Click **Add**

### Step 4 — Set environment variables

In Railway → your service → **Variables**, add:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
DB_PATH=/data/salon.db
SALON_NAME=Mon Salon
SALON_OPENING_HOUR=9
SALON_CLOSING_HOUR=18
SALON_SLOT_MINUTES=30
```

> **Do not set `PORT`** — Railway injects it automatically.

### Step 5 — Get your public URL

Railway assigns a URL like `https://salon-booking-production.up.railway.app`.

Go to **Settings → Networking → Generate Domain** if it hasn't been created yet.

### Step 6 — Update the Twilio webhook

In your Twilio console, set the WhatsApp webhook URL to:

```
https://your-app.up.railway.app/webhook
```

For the **Twilio sandbox**: Messaging → Try it out → Send a WhatsApp message → Sandbox settings.

For a **production WhatsApp number**: Messaging → Senders → WhatsApp senders → configure your number.

### Step 7 — Verify the deployment

```bash
curl https://your-app.up.railway.app/health
# → {"status":"ok"}
```

---

## WhatsApp conversation flow

```
Client sends any message
  → Receives service menu (4 options)
  → Picks a service number
  → Sends a date ("demain", "15/04", "lundi prochain")
  → Picks a time slot from available options
  → Confirms with OUI / cancels with NON
  → Receives confirmation with booking reference

Client sends "annuler"
  → Sees upcoming bookings
  → Picks which one to cancel
  → Receives cancellation confirmation
```

## Services (pre-loaded)

| # | Service | Duration | Price |
|---|---|---|---|
| 1 | Coupe + bouc moustache | 30 min | 35.00 CHF |
| 2 | Coupe | 30 min | 30.00 CHF |
| 3 | Coupe -18ans | 30 min | 25.00 CHF |
| 4 | Coupe + barbe | 45 min | 40.00 CHF |

## Dashboard

The web dashboard (`/`) lets the salon owner:

- View appointments by date (navigate with ← → arrows)
- Filter by status: Confirmé / Terminé / Annulé / Absent
- Search by client name or phone number
- Mark appointments as **Terminé** or **Absent**
- **Cancel** any appointment (sends a WhatsApp notification to the client)
- Create bookings manually with **Nouveau RDV**
- See daily stats and revenue at a glance
