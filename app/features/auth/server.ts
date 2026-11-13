import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../../shared/db/client";

// Importaciones relativas a propósito: este archivo lo carga el CLI de Better Auth,
// que no pasa por Vite ni por los alias de tsconfig.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  advanced: {
    ipAddress: {
      // Dokploy/Traefik añade X-Forwarded-For. Los rangos privados son los
      // proxies de la red de Docker: se saltan para quedarse con la IP real.
      trustedProxies: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
    },
  },
});
