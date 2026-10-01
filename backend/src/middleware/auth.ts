import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyAccess, JwtPayload } from "../lib/auth.js";

export type AuthRequest = Request & { user?: JwtPayload };

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    req.user = verifyAccess(h.slice(7));
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (req.user.role === "SUPER_ADMIN" || roles.includes(req.user.role)) return next();
    return res.status(403).json({ success: false, message: "Forbidden" });
  };
}
