# Habivest — Property & Rental Management Platform

**Tagline:** Find a place. Build a life.

Full-stack **property discovery and rental management** platform demonstrating web application development, backend services, and relational data for the rental lifecycle.



> Not a licensed real-estate broker or bank. Fictional seed data. Platform “verified” is not a government title. Payments use a **mock provider**.

---

## Technologies

| Layer | Stack |
|--------|--------|
| Frontend | **Next.js / React**, TypeScript, Tailwind |
| Backend | **Node.js**, **Express.js**, JWT, Zod |
| Database | **MySQL 8** + Prisma ORM |
| Mobile | Expo shell (optional) |

---

## Key areas

1. **Web application development** — Listing search, property detail, auth, tenant & landlord dashboards  
2. **Backend & database integration** — REST API wired to MySQL for properties, applications, leases, payments  
3. **Property-related data management** — Listings, units, amenities, inquiries, viewings, maintenance  

---

## Structure

```
habivest/
├── backend/     Express + Prisma (MySQL)
├── web/         Next.js public site + dashboards
├── mobile/      Expo shell
├── docs/payments.md
└── docker-compose.yml   # MySQL :3310
```

---

## Features

| Module | Capability |
|--------|------------|
| Auth | Register, login, JWT, roles (tenant, landlord, agent, admin) |
| Listings | Create, publish, public search filters |
| Media | Cover images (Unsplash in seed) |
| Favorites | User ↔ property |
| Inquiries / viewings | Booking with conflict checks |
| Applications | Submit, review, status history |
| Leases | Create, occupy unit, rent schedule |
| Payments | Mock success + rent ledger |
| Maintenance | Tenant tickets, landlord status |
| Analytics | Landlord portfolio summary |

---

## Quick start

```bash
cd habivest
docker compose up -d mysql

cd backend
cp .env.example .env
# DATABASE_URL="mysql://habivest:habivest@localhost:3310/habivest"
npm install
npx prisma generate && npx prisma db push && npm run db:seed
npm run dev    # :4600

cd ../web
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4600/api/v1
npm install && npm run dev   # :3000
```

---

## Demo accounts

Password: **`ChangeMe123!`**

- `landlord@habivest.test`
- `tenant@habivest.test`
- `agent@habivest.test`
- `admin@habivest.test`

---

## Theme

- Forest green (`#14532d`) + sage accent  
- Professional property photography (Unsplash)  
- Card-based listing grid, city destination tiles  

---

## Known limitations

Map SDK UI, S3 media pipeline, real Paystack webhooks, e-sign, and full E2E tests can be extended from the existing models and routes.

---

## Author

**Abdulwaheed Toheeb Olanrewaju**  
Portfolio — Full-Stack Web / Property Tech
