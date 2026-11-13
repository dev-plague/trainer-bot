# Despliegue

> **Objetivo:** un VPS propio con Dokploy y PostgreSQL 18. Esta guía cubre lo mínimo para
> publicar, migrar y verificar. No incluye configuración de dominio ni HTTPS: los aporta
> Dokploy.

## 1. Variables de entorno

| Variable | Obligatoria | Ejemplo / cómo generarla |
|---|---|---|
| `DATABASE_URL` | Sí | `postgresql://usuario:clave@host:5432/trainerbot` |
| `BETTER_AUTH_SECRET` | Sí | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Sí | `https://trainerbot.tudominio.com` |
| `PORT` | No | `3000` por defecto |

- `BETTER_AUTH_URL` debe coincidir **exactamente** con el origen público (esquema y dominio):
  Better Auth lo usa para cookies y orígenes permitidos.
- Los secretos viven solo en el panel de Dokploy. Nunca en el repo ni en la imagen.

## 2. Imagen

El `Dockerfile` es multi-stage: Bun instala y construye, Node ejecuta React Router
(ADR 0001). Corre como usuario `node`, expone `3000` y tiene healthcheck contra `/`.

El servidor de producción es `server.mjs` (Express + adaptador de React Router): añade
cabeceras de seguridad, sirve los assets con caché y confía en el proxy de Dokploy para que
Better Auth pueda resolver la IP del cliente.

```bash
docker build -t trainerbot .
docker run --rm -p 3000:3000 --env-file .env.production trainerbot
curl -I http://localhost:3000
```

La imagen incluye `drizzle/`, `drizzle.config.ts` y las dependencias de desarrollo a
propósito: así puede ejecutar migraciones como comando previo al arranque. Si el tamaño
importa más adelante, se separa un target de migración.

## 3. Migraciones y seed

- Las migraciones se aplican **antes** de arrancar la versión nueva:
  `bun run db:migrate`.
- El seed del catálogo es idempotente y se corre una vez por entorno:
  `bun run db:seed`.
- Nunca se edita la base a mano. Todo cambio de esquema va en `drizzle/`.

En Dokploy, usa el comando de pre-despliegue para `bun run db:migrate`. Si tu versión de
Dokploy no lo permite, ejecuta un contenedor puntual con la misma imagen y variables:

```bash
docker run --rm --env-file .env.production trainerbot bun run db:migrate
docker run --rm --env-file .env.production trainerbot bun run db:seed
```

## 4. Pasos en Dokploy

1. Crea el proyecto y la aplicación desde `dev-plague/trainer-bot`.
2. Build type: **Dockerfile**.
3. Carga las variables de entorno de la sección 1.
4. Asigna el dominio y deja que Dokploy gestione HTTPS.
5. Configura el comando de pre-despliegue: `bun run db:migrate`.
6. Healthcheck: `/`.
7. Crea el servicio PostgreSQL 18 y usa su host interno en `DATABASE_URL`.
8. Tras el primer despliegue, corre el seed una vez.
9. Activa backups programados de PostgreSQL y prueba una restauración.

## 5. Verificación después de desplegar

- `GET /` responde 200 y el healthcheck queda verde.
- Registro, consentimientos, perfil, cuestionario e IMC completan sin errores.
- Generar un plan y empezar una sesión funciona contra la base real.
- Los logs no muestran tracebacks ni contraseñas.

## 6. Operación

- **Backups:** programados en Dokploy; una copia sin restauración probada no cuenta.
- **Secretos:** rotar `BETTER_AUTH_SECRET` invalida las sesiones activas; hazlo si se filtra.
- **Rate limiting:** Better Auth lo activa por defecto en producción.
- **Datos personales:** el borrado de cuenta elimina perfil, consentimientos, planes y
  sesiones en cascada. No copies datos reales a entornos de prueba.
- **Logs:** no registres contraseñas ni datos de salud.

## 7. Límites conocidos del MVP

- Sin verificación de correo ni recuperación de contraseña: no hay proveedor de correo
  (decisión registrada en el brief).
- La CSP usa `'unsafe-inline'` en `script-src` porque React Router emite scripts inline de
  hidratación. Endurecerla con nonces es el siguiente paso; hoy ya bloquea orígenes externos,
  `frame-ancestors` y `object-src`.
- Los días de cuerpo completo son iguales entre sí (rotación pendiente).
- Falta la revisión profesional del catálogo y del motor antes del lanzamiento.
