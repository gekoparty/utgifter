import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const resolveBaseURL = () =>
  trimTrailingSlash(
    process.env.BETTER_AUTH_URL ||
      process.env.API_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      `http://localhost:${process.env.PORT || 5000}`,
  );

const isSecureProductionAuth = () => resolveBaseURL().startsWith("https://");

export const createBetterAuth = ({ db, trustedOrigins }) =>
  betterAuth({
    basePath: "/api/auth",
    baseURL: resolveBaseURL(),
    secret:
      process.env.BETTER_AUTH_SECRET ||
      process.env.AUTH_SECRET ||
      "dev-only-change-this-better-auth-secret",
    trustedOrigins,
    database: mongodbAdapter(db, {
      transaction: false,
    }),
    advanced: {
      useSecureCookies: isSecureProductionAuth(),
      defaultCookieAttributes: isSecureProductionAuth()
        ? {
            sameSite: "none",
            secure: true,
          }
        : undefined,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
    },
  });
