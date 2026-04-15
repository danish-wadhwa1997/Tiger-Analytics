import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/pricingdb",
  jwtSecret: process.env.JWT_SECRET ?? "local-dev-secret-change-me",
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;
