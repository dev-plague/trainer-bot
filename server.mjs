import { createRequestHandler } from "@react-router/express";
import express from "express";

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT ?? 3000);

const app = express();

app.disable("x-powered-by");

// Detrás de Dokploy/Traefik hay un proxy: sin esto, req.ip sería el del proxy y
// el rate limiting de Better Auth contaría a todo el mundo como una sola IP.
if (isProduction) {
  app.set("trust proxy", 1);
}

const baseHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// La CSP estricta solo en producción: en desarrollo Vite necesita inline
// scripts, estilos y WebSocket para el HMR.
const productionHeaders = {
  ...baseHeaders,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; "),
};

app.use((_request, response, next) => {
  const headers = isProduction ? productionHeaders : baseHeaders;

  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }

  next();
});

app.use("/assets", express.static("build/client/assets", { immutable: true, maxAge: "1y" }));
app.use(express.static("build/client", { maxAge: "1h" }));

const build = await import("./build/server/index.js");

app.use(createRequestHandler({ build, mode: isProduction ? "production" : "development" }));

app.listen(port, "0.0.0.0", () => {
  console.log(`Trainerbot escuchando en http://localhost:${port}`);
});
