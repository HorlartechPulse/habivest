import crypto from "crypto";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { Role } from "@prisma/client";
import { prisma } from "./prisma.js";

const secret = () => process.env.JWT_ACCESS_SECRET || "dev-habivest-access";

export type JwtPayload = { sub: string; role: Role; email: string };

export async function hashPassword(p: string) {
  return argon2.hash(p, { type: argon2.argon2id });
}
export async function verifyPassword(hash: string, p: string) {
  try {
    return await argon2.verify(hash, p);
  } catch {
    return false;
  }
}
export function signAccess(payload: JwtPayload) {
  return jwt.sign(payload, secret(), { expiresIn: "8h" });
}
export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, secret()) as JwtPayload;
}
export function generateReference(prefix = "HBV") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
export function slugify(t: string) {
  return t
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
export async function audit(
  userId: string | undefined,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: object
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      metadata: metadata as object | undefined,
    },
  });
}

/** Haversine distance km — for nearby search */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
