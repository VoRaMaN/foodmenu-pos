# Khmer POS - Restaurant Management System

Full-featured POS system for Khmer Surin Restaurant. Built with React 19 + Firebase.

## Features

- **Order Management** — Create, track, and complete orders with full status lifecycle
- **Kitchen Display (KDS)** — Real-time board for kitchen staff with audio notifications
- **Table Management** — Visual 10-table grid with status tracking
- **Payment Processing** — Cash (with change calculation), Card, ABA KHQR (planned)
- **Receipt Printing** — PDF/browser print + thermal printer support (80mm)
- **Menu Management** — CRUD with image upload, availability toggle, categories
- **Staff Management** — 4 roles (Cashier, Waiter, Kitchen, Manager) with permissions
- **Sales Reports** — Revenue, top items, payment breakdown, hourly charts
- **Offline Support** — Firestore IndexedDB persistence for reliability
- **Bilingual** — English + Khmer font support

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS 4
- Firebase (Firestore, Auth, Storage)
- React Router, Recharts, react-to-print, lucide-react

## Quick Start

```bash
npm install
cp .env.example .env    # Fill in your Firebase credentials
npm run dev
```

## Setup Guide

See [SETUP.md](SETUP.md) for detailed Firebase setup, seeding, and deployment instructions.

## Staff Roles

| Role | Access |
|------|--------|
| **Manager** | Everything — orders, menu, staff, reports, settings |
| **Cashier** | Create orders, process payments, print receipts |
| **Waiter** | Create orders, manage assigned tables |
| **Kitchen** | Kitchen display, update order status |

## Order Lifecycle

```
NEW → SENT_TO_KITCHEN → PREPARING → READY → SERVED → COMPLETED (payment)
```

Manager can cancel orders from any status.
