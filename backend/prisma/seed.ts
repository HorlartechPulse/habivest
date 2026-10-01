import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Habivest (fictional)...");
  const hash = await argon2.hash("ChangeMe123!", { type: argon2.argon2id });

  const amenities = await Promise.all(
    ["Parking", "Generator", "Security", "Internet", "Air conditioning", "Water supply"].map(
      (name) =>
        prisma.amenity.upsert({
          where: { name },
          update: {},
          create: { name },
        })
    )
  );

  await prisma.user.upsert({
    where: { email: "admin@habivest.test" },
    update: {},
    create: {
      email: "admin@habivest.test",
      firstName: "Platform",
      lastName: "Admin",
      passwordHash: hash,
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });

  const landlord = await prisma.user.upsert({
    where: { email: "landlord@habivest.test" },
    update: {},
    create: {
      email: "landlord@habivest.test",
      firstName: "Bola",
      lastName: "Adeyemi",
      phone: "08030001001",
      passwordHash: hash,
      role: "LANDLORD",
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "agent@habivest.test" },
    update: {},
    create: {
      email: "agent@habivest.test",
      firstName: "Chioma",
      lastName: "Eze",
      passwordHash: hash,
      role: "AGENT",
      emailVerified: true,
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: "tenant@habivest.test" },
    update: {},
    create: {
      email: "tenant@habivest.test",
      firstName: "Tunde",
      lastName: "Okoro",
      passwordHash: hash,
      role: "TENANT",
      emailVerified: true,
    },
  });

  const listings = [
    {
      title: "Modern 2 Bedroom Apartment in Lekki",
      slug: "modern-2bed-lekki",
      description:
        "Bright apartment with reliable power backup and security. Fictional listing for Habivest demo.",
      propertyType: "Apartment",
      city: "Lagos",
      state: "Lagos",
      district: "Lekki",
      bedrooms: 2,
      bathrooms: 2,
      rentAmount: 1500000,
      latitude: 6.4474,
      longitude: 3.4723,
      coverImageUrl:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    },
    {
      title: "Spacious 3 Bedroom Duplex in Abuja",
      slug: "3bed-duplex-abuja",
      description: "Family-friendly duplex in a quiet estate (fictional).",
      propertyType: "Duplex",
      city: "Abuja",
      state: "FCT",
      district: "Gwarinpa",
      bedrooms: 3,
      bathrooms: 3,
      rentAmount: 2800000,
      latitude: 9.1106,
      longitude: 7.4165,
      coverImageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    },
    {
      title: "Studio Flat near UI, Ibadan",
      slug: "studio-ibadan-ui",
      description: "Compact studio suitable for young professionals (fictional).",
      propertyType: "Studio",
      city: "Ibadan",
      state: "Oyo",
      district: "Bodija",
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 450000,
      latitude: 7.443,
      longitude: 3.9,
      coverImageUrl:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    },
  ];

  for (const l of listings) {
    await prisma.property.upsert({
      where: { slug: l.slug },
      update: {},
      create: {
        ownerId: landlord.id,
        title: l.title,
        slug: l.slug,
        description: l.description,
        propertyType: l.propertyType,
        city: l.city,
        state: l.state,
        district: l.district,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        rentAmount: l.rentAmount,
        depositAmount: l.rentAmount * 0.5,
        latitude: l.latitude,
        longitude: l.longitude,
        coverImageUrl: l.coverImageUrl,
        status: "PUBLISHED",
        isVerified: true,
        amenities: {
          create: amenities.slice(0, 4).map((a) => ({ amenityId: a.id })),
        },
        units: {
          create: {
            label: "Main",
            bedrooms: l.bedrooms,
            bathrooms: l.bathrooms,
            rentAmount: l.rentAmount,
            status: "AVAILABLE",
          },
        },
      },
    });
  }

  console.log("✅ Seed complete");
  console.log("   landlord@habivest.test / ChangeMe123!");
  console.log("   tenant@habivest.test / ChangeMe123!");
  console.log("   agent@habivest.test / ChangeMe123!");
  console.log("   admin@habivest.test / ChangeMe123!");
  void tenant;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
