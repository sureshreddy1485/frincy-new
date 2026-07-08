# Frincy - Modern Digital Ledger Application

Frincy is a highly scalable, offline-first digital ledger and bookkeeping application.

## Architecture

This project is separated into two completely independent parts:

- `frontend/`: Expo React Native Application (Offline-first, WatermelonDB, Zustand, MMKV).
- `backend/`: Node.js Express API (Prisma, PostgreSQL, Render deployment).

### Frontend Stack
- React Native & Expo (Expo Router)
- React Native Paper (Material Design 3)
- WatermelonDB & MMKV (Offline-First Storage)
- Zustand (State Management)
- TanStack Query (Server State)
- React Hook Form & Zod (Forms)
- Reanimated & FlashList (Performance)

### Backend Stack
- Node.js & Express (TypeScript)
- Prisma ORM & PostgreSQL
- JWT & Refresh Tokens
- Helmet, CORS, Express Rate Limit (Security)
- Winston (Logging)
- Docker & Render (Deployment)

## Getting Started

1. Navigate to `backend/` and run `npm i` then `npm run dev` (requires postgres running).
2. Navigate to `frontend/` and run `npm start` (or `npx expo start`).
