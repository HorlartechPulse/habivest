import { Router } from "express";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma.js";
import {
  hashPassword,
  verifyPassword,
  signAccess,
  generateReference,
  slugify,
  audit,
  distanceKm,
} from "../lib/auth.js";
import { authenticate, requireRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

function validate(schema: z.ZodSchema) {
  return (
    req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction
  ) => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: r.error.flatten().fieldErrors,
      });
    }
    req.body = r.data;
    next();
  };
}

router.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: "ok", service: "habivest" } });
  } catch {
    res.status(503).json({ success: false, message: "DB down" });
  }
});

// ——— Auth ———
router.post(
  "/auth/register",
  validate(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["PROPERTY_SEEKER", "TENANT", "LANDLORD", "AGENT"]).optional(),
    })
  ),
  async (req, res) => {
    if (await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } })) {
      return res.status(409).json({ success: false, message: "Email taken" });
    }
    const user = await prisma.user.create({
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email.toLowerCase(),
        passwordHash: await hashPassword(req.body.password),
        role: req.body.role || "PROPERTY_SEEKER",
      },
    });
    const accessToken = signAccess({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
    await audit(user.id, "REGISTER", "User", user.id);
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
      },
    });
  }
);

router.post(
  "/auth/login",
  validate(z.object({ email: z.string().email(), password: z.string() })),
  async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
    });
    if (!user || !(await verifyPassword(user.passwordHash, req.body.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account suspended" });
    }
    const accessToken = signAccess({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
    await audit(user.id, "LOGIN", "User", user.id);
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
      },
    });
  }
);

router.get("/auth/me", authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
    },
  });
  res.json({ success: true, data: user });
});

// ——— Property search (public) ———
router.get("/properties", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(40, Number(req.query.limit) || 12);
  const city = req.query.city as string | undefined;
  const type = req.query.type as string | undefined;
  const minBeds = req.query.minBeds ? Number(req.query.minBeds) : undefined;
  const maxRent = req.query.maxRent ? Number(req.query.maxRent) : undefined;
  const minRent = req.query.minRent ? Number(req.query.minRent) : undefined;
  const furnished = req.query.furnished === "true" ? true : undefined;
  const q = req.query.q as string | undefined;
  const sort = (req.query.sort as string) || "newest";

  const where = {
    status: "PUBLISHED" as const,
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
    ...(type ? { propertyType: type } : {}),
    ...(minBeds !== undefined ? { bedrooms: { gte: minBeds } } : {}),
    ...(maxRent !== undefined ? { rentAmount: { lte: maxRent } } : {}),
    ...(minRent !== undefined ? { rentAmount: { gte: minRent } } : {}),
    ...(furnished !== undefined ? { furnished } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
            { district: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { rentAmount: "asc" as const }
      : sort === "price_desc"
        ? { rentAmount: "desc" as const }
        : sort === "views"
          ? { viewCount: "desc" as const }
          : { createdAt: "desc" as const };

  const [total, data] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        amenities: { include: { amenity: true } },
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { units: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.get("/properties/:slug", async (req, res) => {
  const property = await prisma.property.findFirst({
    where: { slug: req.params.slug, status: "PUBLISHED" },
    include: {
      amenities: { include: { amenity: true } },
      units: true,
      owner: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
  });
  if (!property) return res.status(404).json({ success: false, message: "Not found" });

  await prisma.property.update({
    where: { id: property.id },
    data: { viewCount: { increment: 1 } },
  });
  await prisma.analyticsEvent.create({
    data: { type: "PROPERTY_VIEW", entityId: property.id },
  });

  // Hide exact street if configured
  const publicProp = {
    ...property,
    street: property.hideExactAddress ? null : property.street,
  };
  res.json({ success: true, data: publicProp });
});

// Nearby (optional lat/lng)
router.get("/properties/nearby/search", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radiusKm) || 10;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: "lat and lng required" });
  }
  const all = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      latitude: { not: null },
      longitude: { not: null },
    },
    take: 100,
  });
  const data = all
    .map((p) => ({
      ...p,
      distanceKm: distanceKm(
        lat,
        lng,
        Number(p.latitude),
        Number(p.longitude)
      ),
    }))
    .filter((p) => p.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 30);
  res.json({ success: true, data });
});

// Landlord create
router.post(
  "/properties",
  authenticate,
  requireRoles("LANDLORD", "PROPERTY_OWNER", "PROPERTY_MANAGER", "AGENT", "ADMIN", "SUPER_ADMIN"),
  validate(
    z.object({
      title: z.string().min(3),
      description: z.string().min(10),
      propertyType: z.string(),
      city: z.string(),
      state: z.string().optional(),
      district: z.string().optional(),
      street: z.string().optional(),
      bedrooms: z.number().int().min(0),
      bathrooms: z.number().int().min(0),
      rentAmount: z.number().positive(),
      depositAmount: z.number().optional(),
      furnished: z.boolean().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      coverImageUrl: z.string().optional(),
      imageUrls: z.array(z.string()).optional(),
      amenityIds: z.array(z.string()).optional(),
      publish: z.boolean().optional(),
    })
  ),
  async (req: AuthRequest, res) => {
    let slug = slugify(req.body.title);
    if (await prisma.property.findUnique({ where: { slug } })) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    const property = await prisma.property.create({
      data: {
        ownerId: req.user!.sub,
        title: req.body.title,
        slug,
        description: req.body.description,
        propertyType: req.body.propertyType,
        city: req.body.city,
        state: req.body.state,
        district: req.body.district,
        street: req.body.street,
        bedrooms: req.body.bedrooms,
        bathrooms: req.body.bathrooms,
        rentAmount: new Decimal(req.body.rentAmount),
        depositAmount: req.body.depositAmount
          ? new Decimal(req.body.depositAmount)
          : undefined,
        furnished: req.body.furnished || false,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        coverImageUrl: req.body.coverImageUrl,
        imageUrls: req.body.imageUrls || [],
        status: req.body.publish ? "PUBLISHED" : "DRAFT",
        amenities: req.body.amenityIds?.length
          ? {
              create: req.body.amenityIds.map((amenityId: string) => ({
                amenityId,
              })),
            }
          : undefined,
        units: {
          create: {
            label: "Unit 1",
            bedrooms: req.body.bedrooms,
            bathrooms: req.body.bathrooms,
            rentAmount: new Decimal(req.body.rentAmount),
            status: "AVAILABLE",
          },
        },
      },
    });
    await audit(req.user!.sub, "CREATE_PROPERTY", "Property", property.id);
    res.status(201).json({ success: true, data: property });
  }
);

router.patch(
  "/properties/:id/status",
  authenticate,
  requireRoles("LANDLORD", "PROPERTY_OWNER", "PROPERTY_MANAGER", "AGENT", "ADMIN", "SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    const prop = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!prop) return res.status(404).json({ success: false, message: "Not found" });
    if (
      prop.ownerId !== req.user!.sub &&
      req.user!.role !== "ADMIN" &&
      req.user!.role !== "SUPER_ADMIN"
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const updated = await prisma.property.update({
      where: { id: prop.id },
      data: { status: req.body.status },
    });
    await audit(req.user!.sub, "PROPERTY_STATUS", "Property", prop.id, {
      status: req.body.status,
    });
    res.json({ success: true, data: updated });
  }
);

// Favorites
router.post("/favorites/:propertyId", authenticate, async (req: AuthRequest, res) => {
  const fav = await prisma.favoriteProperty.upsert({
    where: {
      userId_propertyId: {
        userId: req.user!.sub,
        propertyId: req.params.propertyId,
      },
    },
    create: { userId: req.user!.sub, propertyId: req.params.propertyId },
    update: {},
  });
  await prisma.analyticsEvent.create({
    data: {
      type: "PROPERTY_SAVED",
      entityId: req.params.propertyId,
      userId: req.user!.sub,
    },
  });
  res.status(201).json({ success: true, data: fav });
});

router.get("/favorites", authenticate, async (req: AuthRequest, res) => {
  const data = await prisma.favoriteProperty.findMany({
    where: { userId: req.user!.sub },
    include: { property: true },
  });
  res.json({ success: true, data });
});

// Inquiries
router.post(
  "/inquiries",
  authenticate,
  validate(z.object({ propertyId: z.string(), message: z.string().min(5) })),
  async (req: AuthRequest, res) => {
    const inquiry = await prisma.propertyInquiry.create({
      data: {
        propertyId: req.body.propertyId,
        userId: req.user!.sub,
        message: req.body.message,
      },
    });
    const prop = await prisma.property.findUnique({
      where: { id: req.body.propertyId },
    });
    if (prop) {
      await prisma.notification.create({
        data: {
          userId: prop.ownerId,
          title: "New inquiry",
          body: `Inquiry on ${prop.title}`,
          type: "INQUIRY",
        },
      });
    }
    res.status(201).json({ success: true, data: inquiry });
  }
);

// Viewings
router.post(
  "/viewings",
  authenticate,
  validate(
    z.object({
      propertyId: z.string(),
      scheduledAt: z.string(),
      notes: z.string().optional(),
    })
  ),
  async (req: AuthRequest, res) => {
    const scheduledAt = new Date(req.body.scheduledAt);
    const clash = await prisma.viewing.findFirst({
      where: {
        propertyId: req.body.propertyId,
        status: { in: ["REQUESTED", "CONFIRMED"] },
        scheduledAt: {
          gte: new Date(scheduledAt.getTime() - 30 * 60 * 1000),
          lte: new Date(scheduledAt.getTime() + 30 * 60 * 1000),
        },
      },
    });
    if (clash) {
      return res.status(409).json({ success: false, message: "Slot unavailable" });
    }
    const viewing = await prisma.viewing.create({
      data: {
        propertyId: req.body.propertyId,
        userId: req.user!.sub,
        scheduledAt,
        notes: req.body.notes,
      },
    });
    res.status(201).json({ success: true, data: viewing });
  }
);

// Applications
router.post(
  "/applications",
  authenticate,
  validate(
    z.object({
      propertyId: z.string(),
      unitId: z.string().optional(),
      moveInDate: z.string().optional(),
      message: z.string().optional(),
      employment: z.string().optional(),
      incomeInfo: z.string().optional(),
    })
  ),
  async (req: AuthRequest, res) => {
    const app = await prisma.rentalApplication.create({
      data: {
        propertyId: req.body.propertyId,
        unitId: req.body.unitId,
        applicantId: req.user!.sub,
        moveInDate: req.body.moveInDate ? new Date(req.body.moveInDate) : undefined,
        message: req.body.message,
        employment: req.body.employment,
        incomeInfo: req.body.incomeInfo,
        status: "SUBMITTED",
        statusHistory: {
          create: { toStatus: "SUBMITTED", changedById: req.user!.sub },
        },
      },
    });
    await audit(req.user!.sub, "APPLY", "RentalApplication", app.id);
    res.status(201).json({ success: true, data: app });
  }
);

router.get("/applications/me", authenticate, async (req: AuthRequest, res) => {
  const data = await prisma.rentalApplication.findMany({
    where: { applicantId: req.user!.sub },
    include: { property: { select: { title: true, slug: true, city: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data });
});

router.get(
  "/applications/property/:propertyId",
  authenticate,
  requireRoles("LANDLORD", "PROPERTY_OWNER", "PROPERTY_MANAGER", "AGENT", "ADMIN"),
  async (req: AuthRequest, res) => {
    const prop = await prisma.property.findUnique({
      where: { id: req.params.propertyId },
    });
    if (!prop) return res.status(404).json({ success: false, message: "Not found" });
    if (
      prop.ownerId !== req.user!.sub &&
      req.user!.role !== "ADMIN" &&
      req.user!.role !== "SUPER_ADMIN"
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const data = await prisma.rentalApplication.findMany({
      where: { propertyId: prop.id },
      include: {
        applicant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        statusHistory: { orderBy: { createdAt: "desc" } },
      },
    });
    res.json({ success: true, data });
  }
);

router.patch(
  "/applications/:id/status",
  authenticate,
  requireRoles("LANDLORD", "PROPERTY_OWNER", "PROPERTY_MANAGER", "AGENT", "ADMIN"),
  async (req: AuthRequest, res) => {
    const app = await prisma.rentalApplication.findUnique({
      where: { id: req.params.id },
      include: { property: true },
    });
    if (!app) return res.status(404).json({ success: false, message: "Not found" });
    if (app.property.ownerId !== req.user!.sub && req.user!.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const toStatus = req.body.status;
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.rentalApplication.update({
        where: { id: app.id },
        data: { status: toStatus },
      });
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus: app.status,
          toStatus,
          changedById: req.user!.sub,
          note: req.body.note,
        },
      });
      await tx.notification.create({
        data: {
          userId: app.applicantId,
          title: "Application update",
          body: `Your application is now: ${toStatus}`,
          type: "APPLICATION",
        },
      });
      return u;
    });
    res.json({ success: true, data: updated });
  }
);

// Leases
router.post(
  "/leases",
  authenticate,
  requireRoles("LANDLORD", "PROPERTY_OWNER", "PROPERTY_MANAGER", "ADMIN"),
  validate(
    z.object({
      propertyId: z.string(),
      unitId: z.string().optional(),
      tenantId: z.string(),
      applicationId: z.string().optional(),
      startDate: z.string(),
      endDate: z.string(),
      rentAmount: z.number().positive(),
      depositAmount: z.number().optional(),
      frequency: z.enum(["MONTHLY", "ANNUAL"]).optional(),
    })
  ),
  async (req: AuthRequest, res) => {
    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);
    if (end <= start) {
      return res.status(400).json({ success: false, message: "Invalid lease dates" });
    }

    const lease = await prisma.$transaction(async (tx) => {
      const l = await tx.lease.create({
        data: {
          propertyId: req.body.propertyId,
          unitId: req.body.unitId,
          tenantId: req.body.tenantId,
          applicationId: req.body.applicationId,
          startDate: start,
          endDate: end,
          rentAmount: new Decimal(req.body.rentAmount),
          depositAmount: req.body.depositAmount
            ? new Decimal(req.body.depositAmount)
            : undefined,
          frequency: req.body.frequency || "ANNUAL",
          status: "ACTIVE",
        },
      });
      // One schedule period for demo (annual)
      await tx.rentSchedule.create({
        data: {
          leaseId: l.id,
          dueDate: start,
          amount: new Decimal(req.body.rentAmount),
          status: "DUE",
        },
      });
      if (req.body.unitId) {
        await tx.propertyUnit.update({
          where: { id: req.body.unitId },
          data: { status: "OCCUPIED" },
        });
      }
      await tx.property.update({
        where: { id: req.body.propertyId },
        data: { status: "RENTED" },
      });
      return l;
    });

    await audit(req.user!.sub, "CREATE_LEASE", "Lease", lease.id);
    res.status(201).json({ success: true, data: lease });
  }
);

// Mock rent payment
router.post(
  "/payments/rent",
  authenticate,
  validate(z.object({ leaseId: z.string(), amount: z.number().positive() })),
  async (req: AuthRequest, res) => {
    const lease = await prisma.lease.findUnique({
      where: { id: req.body.leaseId },
    });
    if (!lease) return res.status(404).json({ success: false, message: "Lease not found" });
    if (lease.tenantId !== req.user!.sub && req.user!.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const reference = generateReference("RENT");
    // Mock provider: always succeeds in development
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.rentPayment.create({
        data: {
          leaseId: lease.id,
          tenantId: req.user!.sub,
          amount: new Decimal(req.body.amount),
          reference,
          provider: "mock",
          providerRef: `mock_${reference}`,
          status: "SUCCESS",
          paidAt: new Date(),
        },
      });
      await tx.rentLedgerEntry.createMany({
        data: [
          {
            leaseId: lease.id,
            entryType: "CREDIT",
            amount: new Decimal(req.body.amount),
            memo: `Rent payment ${reference}`,
          },
        ],
      });
      await tx.rentSchedule.updateMany({
        where: { leaseId: lease.id, status: { in: ["DUE", "OVERDUE"] } },
        data: { status: "PAID", paidAt: new Date() },
      });
      return p;
    });

    await prisma.notification.create({
      data: {
        userId: lease.tenantId,
        title: "Payment successful",
        body: `Rent payment ${reference} recorded (mock provider).`,
        type: "PAYMENT",
      },
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded via MockPaymentProvider",
      data: payment,
    });
  }
);

// Maintenance
router.post(
  "/maintenance",
  authenticate,
  validate(
    z.object({
      propertyId: z.string(),
      unitId: z.string().optional(),
      title: z.string().min(3),
      description: z.string().min(5),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      category: z.string().optional(),
    })
  ),
  async (req: AuthRequest, res) => {
    const ticket = await prisma.maintenanceRequest.create({
      data: {
        propertyId: req.body.propertyId,
        unitId: req.body.unitId,
        tenantId: req.user!.sub,
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority || "MEDIUM",
        category: req.body.category,
      },
    });
    res.status(201).json({ success: true, data: ticket });
  }
);

router.patch(
  "/maintenance/:id/status",
  authenticate,
  requireRoles("LANDLORD", "PROPERTY_OWNER", "PROPERTY_MANAGER", "ADMIN"),
  async (req: AuthRequest, res) => {
    const ticket = await prisma.maintenanceRequest.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json({ success: true, data: ticket });
  }
);

// Amenities list
router.get("/amenities", async (_req, res) => {
  res.json({ success: true, data: await prisma.amenity.findMany({ orderBy: { name: "asc" } }) });
});

// Analytics
router.get(
  "/analytics/summary",
  authenticate,
  requireRoles("LANDLORD", "PROPERTY_OWNER", "ADMIN", "SUPER_ADMIN", "ANALYST"),
  async (req: AuthRequest, res) => {
    const ownerFilter =
      req.user!.role === "LANDLORD" || req.user!.role === "PROPERTY_OWNER"
        ? { ownerId: req.user!.sub }
        : {};
    const [properties, published, applications, leases, payments] = await Promise.all([
      prisma.property.count({ where: ownerFilter }),
      prisma.property.count({ where: { ...ownerFilter, status: "PUBLISHED" } }),
      prisma.rentalApplication.count({
        where: ownerFilter.ownerId
          ? { property: { ownerId: ownerFilter.ownerId } }
          : {},
      }),
      prisma.lease.count({
        where: ownerFilter.ownerId
          ? { property: { ownerId: ownerFilter.ownerId }, status: "ACTIVE" }
          : { status: "ACTIVE" },
      }),
      prisma.rentPayment.aggregate({
        where: {
          status: "SUCCESS",
          ...(ownerFilter.ownerId
            ? { lease: { property: { ownerId: ownerFilter.ownerId } } }
            : {}),
        },
        _sum: { amount: true },
      }),
    ]);
    res.json({
      success: true,
      data: {
        properties,
        published,
        applications,
        activeLeases: leases,
        rentCollected: Number(payments._sum.amount || 0),
      },
    });
  }
);

export default router;
