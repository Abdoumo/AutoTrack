# ⚡ AuraTrack — PERN Product Risk Management & Tracking App

A full-stack **PERN** (PostgreSQL, Express, React, Node.js) web application designed for capturing products, managing inventory lifecycles, detecting shelf-life risk thresholds, and providing administrator oversight with CSV exports and Nodemailer alerts.

---

## 🎯 Features

1. **Product Capture Popup (Modal)**
   - Enter Product Name, Weight (kg), and Description.
   - Automatically generates a unique **UUID Reference ID** and **Creation Timestamp**.
   - Admin can set the product's **Risk Date** (Default: **10 days**).

2. **Risk Date Lifecycles & Alerts**
   - **Day 7 Warning**: Admin email dispatched via Nodemailer/Gmail (`bedoushop@gmail.com`) + yellow status indicator on dashboard.
   - **Day 10 Critical Red Alert**: Pulsating red alert banner on dashboard + critical warning email if the product remains unsold or partially unclaimed after 10 days.

3. **Partial Quantity Claiming ("Take")**
   - Any authorized user can take partial quantities from a product (e.g. 5kg out of 20kg).
   - Real-time stock recalculation with atomic database transactions preventing over-drafts.
   - Remaining stock tracked dynamically until depleted.

4. **Admin Oversight & CSV Export**
   - Live transaction ledger tracking **who took what, when, and how much**.
   - One-click **Export to CSV** generating an instant spreadsheet audit file.
   - Risk deadline adjustment console.

---

## 🚀 Quick Setup Instructions

### 1. Configure Backend Environment (`server/.env`)
Edit `server/.env` with your PostgreSQL database credentials and Gmail app password:

```env
# Database Credentials
DB_USER=postgres
DB_PASSWORD=your_actual_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=product_tracker

# JWT Security
JWT_SECRET=bEdOuShOp_SeCrEt_2026_xK9mZ

# Gmail SMTP & Admin Notifications
GMAIL_USER=bedoushop@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here
ADMIN_EMAIL=bedoushop@gmail.com

PORT=5000
```

### 2. Setup PostgreSQL Database
Run the provided SQL migration to create the tables (`users`, `products`, `transactions`) and indexes:

```bash
psql -U postgres -d product_tracker -f server/database.sql
```

### 3. Seed Initial Admin Account
Run the automated seed script to initialize the super admin user:

```bash
cd server
npm run seed
```

**Admin Credentials:**
- **Email:** `bedoushop@gmail.com`
- **Password:** `Bx9#kLm2vQ7pWsR` (15 characters)

### 4. Start the Application

#### Start Backend (Express + Cron Jobs):
```bash
cd server
npm start
```
*Server runs on `http://localhost:5000`*

#### Start Frontend (React + Vite):
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🗄️ Database Architecture

- `users`: Stores user accounts, bcrypt password hashes, and roles (`admin` / `user`).
- `products`: Tracks UUID references, name, initial weight, remaining quantity, creation timestamp, risk deadline, and status (`active`, `depleted`, `expired`).
- `transactions`: Records quantity taken, user reference, product reference, and timestamp.
# AutoTrack
