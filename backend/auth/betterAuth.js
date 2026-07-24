import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

export const createBetterAuth = ({ db, trustedOrigins }) =>
  betterAuth({
    basePath: "/api/auth",
    baseURL:
      process.env.BETTER_AUTH_URL ||
      process.env.API_URL ||
      `http://localhost:${process.env.PORT || 5000}`,
    secret:
      process.env.BETTER_AUTH_SECRET ||
      process.env.AUTH_SECRET ||
      "dev-only-change-this-better-auth-secret",
    trustedOrigins,
    database: mongodbAdapter(db, {
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
    },
  });
