# Campus Rent — PRD

## Original Problem Statement
Peer-to-peer rental marketplace for college students (textbooks, electronics, mobility, dorm gear). Web app, mobile-first constrained layout simulating a native app on desktop. Features: auth, home feed, post listing, requests/bookings, real-time chat, my listings, profiles + reviews, item detail with map + date-range booking.

## User Choices
- Auth: Emergent-managed Google login (session-based, httpOnly cookie + Bearer fallback)
- Image storage: Emergent object storage
- Map: Google Maps embed (OpenStreetMap fallback when REACT_APP_GOOGLE_MAPS_API_KEY unset)
- Reviews/ratings: included in v1
- Chat: full WebSocket real-time

## Architecture
- Frontend: React 19 + Tailwind, react-router, Context (Auth), lucide-react, sonner. Mobile shell (max-w-md), Volt-green dark theme, glassmorphism.
- Backend: FastAPI + motor (MongoDB), session auth, WebSocket chat, Emergent object storage.
- DB collections: users, user_sessions, items, requests, conversations, messages, reviews, files.

## Implemented (2026-06-29)
- Google OAuth session flow (AuthCallback, /auth/session, /auth/me, /auth/logout, /auth/profile)
- Items CRUD + filters (category/search/sort), likes/favorites, my-listings; image upload + serving
- Item detail: carousel, owner card, map preview, date-range picker w/ auto total, send request
- Bookings: incoming/mine tabs, status pills, accept (custom price), reject, cancel (reason → system chat msg)
- Real-time chat: inbox w/ unread counts, WebSocket conversation view, system messages
- My Listings (edit/delete), Profile (edit, notification prefs, logout), Public profile + reviews/ratings
- Seeded 3 owners + 4 demo items at startup
- Backend tested: 25/25 pytest pass. Frontend pages verified.

## Known / Deferred (P2)
- DELETE item doesn't cascade-cancel active accepted requests (noted; low impact)
- Distance calc is placeholder (uses city label, fixed coords)
- Google Maps key not yet provided → OpenStreetMap fallback active

## Next Action Items
- Add REACT_APP_GOOGLE_MAPS_API_KEY when user provides it (map auto-upgrades)
- Real geolocation-based distance sorting
- Push/realtime notifications for new requests & messages
