# LuxeVoyage — Premium Luxury Travel Platform

## Original Problem Statement
Design and develop a premium, production-ready website for a modern Travel & Tourism company (Airbnb / Booking.com / Luxury Escapes caliber). Cinematic, minimal, immersive with glassmorphism, smooth motion, premium typography (Poppins + Playfair Display), dark & light mode.

## User Choices
- Tech: React + FastAPI + MongoDB (adapted from requested Next.js/Firebase due to env)
- AI Trip Planner: Claude Sonnet 4.6 via Emergent LLM Key
- Auth: JWT custom auth (bcrypt + JWT)
- Payments: Mocked for MVP (coupon `LUXE10` for 10% off)
- Imagery: Curated Unsplash/Pexels — Bali, Santorini, Maldives, Swiss Alps, Kyoto, Dubai, Iceland, Paris

## Architecture
- Backend: FastAPI :8001, MongoDB (motor async), JWT auth (bcrypt), emergentintegrations for Claude.
- Frontend: React 19, React Router 7, Framer Motion, TailwindCSS, lucide-react, sonner, axios.
- Routes: /, /destinations, /destinations/:id, /packages, /packages/:id, /ai-planner, /booking/:id, /gallery, /about, /contact, /login, /signup, /dashboard.
- Theming: CSS variables, dark mode via `html.dark` class, persisted in localStorage.
- Animations: hero parallax+zoom, magnetic buttons, ripple clicks, scroll reveal, animated counters, marquee, page transitions, cursor glow, countdown, testimonial autorotate.

## v1 Features (June 2026)
- Cinematic hero (parallax bg, animated headline, search widget)
- Trust logo marquee
- Popular Destinations (8 cards hover-zoom)
- Featured Packages with 6 category tabs + search/sort
- Package Detail (gallery, day-by-day itinerary accordion, included/excluded, FAQs, sticky booking sidebar, wishlist)
- AI Trip Planner (Claude Sonnet 4.6) — JSON itinerary with morning/afternoon/evening + packing tips + insider tip
- Multi-step Booking Flow (Traveler → Details → Payment → Confirmation)
- Why Choose Us (8 icon cards), Special Offer (countdown), Testimonials (autorotate)
- Photo Gallery (masonry + lightbox)
- About (stats counters, values, timeline, team)
- Contact (form + Google Map + WhatsApp)
- Auth (signup/login) split-screen
- Customer Dashboard (trips/wishlist/rewards tiers)
- Footer with newsletter
- Dark / Light mode, smooth scroll, scroll-to-top
- MongoDB auto-seeded (8 dest + 6 pkgs)

## Test Status (Iteration 1)
- Backend: 100% (18 pytest tests)
- Frontend: 100% (Playwright e2e)
- Real Claude AI call verified end-to-end

## Personas
- Luxury honeymooners, solo adventurers, family travelers, AI-curious browsers

## Backlog
### P1
- Interactive world map (Destination Explorer)
- 360° viewer & video on Tour Details
- Custom Trip Builder (flights + hotels + activities composer)
- Real Stripe integration (test mode)
- Travel Blog (magazine layout)
- Live chat concierge widget
- Currency converter / multi-currency
- Admin Panel (inventory management)

### P2
- Three.js immersive hero
- Lenis smooth scroll
- Lottie animations
- PWA + offline
- Schema markup & SEO

## Env Variables
- MONGO_URL, DB_NAME (preset)
- EMERGENT_LLM_KEY (set)
- JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_MINUTES

## Next Action Items
1. Interactive world map for Destinations
2. Custom Trip Builder with live pricing
3. Real Stripe integration
4. Travel Blog + Live Chat
5. Admin panel
