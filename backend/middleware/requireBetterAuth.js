import { fromNodeHeaders } from "better-auth/node";
import AppUser from "../models/appUserSchema.js";

const toSafeAppUser = (appUser) => ({
  id: String(appUser._id),
  betterAuthUserId: appUser.betterAuthUserId,
  email: appUser.email,
  name: appUser.name,
  role: appUser.role,
});

const ensureAppUser = async (authUser) => {
  const betterAuthUserId = String(authUser?.id || "");
  if (!betterAuthUserId) return null;

  const existing = await AppUser.findOne({ betterAuthUserId });
  if (existing) {
    if (existing.role !== "admin") {
      const adminExists = await AppUser.exists({ role: "admin" });
      if (!adminExists) {
        existing.role = "admin";
        await existing.save();
      }
    }
    return existing;
  }

  const existingCount = await AppUser.countDocuments();
  return AppUser.create({
    betterAuthUserId,
    email: String(authUser.email || "").toLowerCase(),
    name: String(authUser.name || ""),
    role: existingCount === 0 ? "admin" : "user",
  });
};

export const createRequireBetterAuth = (auth) => async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ message: "Du må logge inn først." });
    }

    const appUser = await ensureAppUser(session.user);
    if (!appUser) {
      return res.status(401).json({ message: "Kunne ikke lese bruker." });
    }

    req.authSession = session;
    req.appUser = toSafeAppUser(appUser);
    req.user = req.appUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.appUser?.role !== "admin") {
    return res.status(403).json({ message: "Kun administrator har tilgang." });
  }

  next();
};
