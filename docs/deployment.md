# Despliegue

> **Objetivo:** publicar el MVP en un VPS propio con Dokploy, PostgreSQL 18 y HTTPS. Cubre
> requisitos, primer despliegue, migraciones, verificación y operación.

## 0. Qué necesitas antes de empezar

| Pieza | Detalle |
|---|---|
| Servidor | VPS Linux (x86_64) con Docker, **2 vCPU / 2 GB RAM / 20 GB SSD** como mínimo. La imagen compila Vite y React Router en el servidor; con 1 GB el build suele morir por falta de memoria. |
| Dominio | Un dominio o subdominio (p. ej. `trainerbot.tudominio.com`) con registro `A` (y `AAAA` si hay IPv6) apuntando al VPS. Sin dominio no hay HTTPS, y **la app no funciona bien sin HTTPS** (ver §6). |
| Dokploy | Instalado y con acceso al repositorio `dev-plague/trainer-bot`. |
| PostgreSQL | 18, como servicio de Dokploy en la misma red interna (no expongas el puerto a internet). |
| Repositorio | `main` actualizado. Cada merge a `main` pasa el CI y es lo que se despliega. |
| Secretos | `BETTER_AUTH_SECRET` generado con `openssl rand -base64 32`. Vive solo en el panel de Dokploy. |

La imagen necesita Node 22.22 o superior; el `Dockerfile` usa `node:22-alpine`, que ya lo
cumple.

## 1. Variables de entorno

| Variable | Obligatoria | Ejemplo / cómo generarla |
|---|---|---|
| `DATABASE_URL` | Sí | `postgresql://usuario:clave@host:5432/trainerbot` (host interno del servicio de Dokploy) |
| `BETTER_AUTH_SECRET` | Sí | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Sí | `https://trainerbot.tudominio.com` |
| `PORT` | No | `3000` por defecto; la imagen ya expone 3000 |

- `BETTER_AUTH_URL` debe coincidir **exactamente** con el origen público (esquema `https` y
  dominio): Better Auth lo usa para las cookies y los orígenes permitidos.
- `NODE_ENV=production` lo fija la imagen. No lo sobrescribas: de él dependen las cabeceras de
  seguridad y el arranque en modo producción.
- Los secretos viven solo en el panel de Dokploy. Nunca en el repo ni en la imagen.

## 2. Imagen

El `Dockerfile` es multi-stage: Bun 1.4.2 instala y construye, Node 22 ejecuta React Router
(ADR 0001). Corre como usuario `node`, expone `3000` y tiene healthcheck contra `/`.

El servidor de producción es `server.mjs` (Express + adaptador de React Router): añade
cabeceras de seguridad (CSP, HSTS, `frame-ancestors`, `nosniff`, etc.), sirve los assets con
caché y confía en el proxy de Dokploy para que Better Auth pueda resolver la IP del cliente.

```bash
docker build -t trainerbot .
docker run --rm -p 3000:3000 --env-file .env.production trainerbot
curl -I http://localhost:3000
```

La imagen incluye `drizzle/`, `drizzle.config.ts`, `app/` y las dependencias de desarrollo a
propósito: así puede ejecutar migraciones y el seed como comandos previos al arranque. Si el
tamaño importa más adelante, se separa un target de migración.

## 3. Migraciones y seed

- Las migraciones se aplican **antes** de arrancar la versión nueva: `bun run db:migrate`
  (hoy hay 11 migraciones, `0000`–`0010`).
- El seed del catálogo (52 entradas) es idempotente y se corre una vez por entorno:
  `bun run db:seed`. Vuelve a correrse solo cuando cambie el catálogo.
- Nunca se edita la base a mano. Todo cambio de esquema va en `drizzle/`.

En Dokploy, usa el comando de pre-despliegue para `bun run db:migrate`. Si tu versión de
Dokploy no lo permite, ejecuta un contenedor puntual con la misma imagen y variables:

```bash
docker run --rm --env-file .env.production trainerbot bun run db:migrate
docker run --rm --env-file .env.production trainerbot bun run db:seed
```

## 4. Primer despliegue, paso a paso

1. Apunta el dominio al VPS y espera a que resuelva (`dig +short trainerbot.tudominio.com`).
2. En Dokploy, crea el proyecto y la aplicación desde `dev-plague/trainer-bot`.
3. Build type: **Dockerfile**; puerto del contenedor: **3000**.
4. Carga las variables de entorno de la sección 1.
5. Crea el servicio PostgreSQL 18 y usa su host interno en `DATABASE_URL`.
6. Asigna el dominio y deja que Dokploy emita el certificado HTTPS **antes** de abrir la app
   al público (§6).
7. Configura el comando de pre-despliegue: `bun run db:migrate`.
8. Healthcheck: `/`.
9. Despliega. Tras el primer arranque correcto, corre el seed una vez.
10. Activa backups programados de PostgreSQL y prueba una restauración.

## 5. Verificación después de desplegar

- `GET /` responde 200 y el healthcheck queda verde.
- El certificado es válido y `https://` no muestra avisos; `http://` redirige a `https://`.
- Registro, consentimientos, perfil, cuestionario e IMC completan sin errores.
- Generar un plan y empezar una sesión funciona contra la base real, y la sesión se reanuda al
  recargar.
- Los logs no muestran tracebacks ni contraseñas.

## 6. HTTPS, cookies y HSTS

- `server.mjs` envía `Strict-Transport-Security` en producción. Los navegadores lo recuerdan
  un año: si pruebas la app por HTTP con la cabecera activa, ese dominio quedará forzado a
  HTTPS. **Configura el dominio y el certificado antes de la primera visita real.**
- Better Auth marca las cookies como `secure` cuando `BETTER_AUTH_URL` es `https`. Si la
  variable dice `http`, el login fallará en producción.
- Detrás del proxy, `trust proxy` está en `1` y los rangos privados de Docker están
  confiados, para que el rate limiting cuente IPs reales y no la del proxy.

## 7. Operación

- **Backups:** programados en Dokploy; una copia sin restauración probada no cuenta.
- **Secretos:** rotar `BETTER_AUTH_SECRET` invalida las sesiones activas; hazlo si se filtra.
- **Rate limiting:** Better Auth lo activa por defecto en producción.
- **Datos personales:** el borrado de cuenta elimina perfil, consentimientos, planes y
  sesiones en cascada. No copies datos reales a entornos de prueba.
- **Catálogo:** si cambia el seed, despliega y corre `bun run db:seed` después; es idempotente.
- **Motor:** los planes guardan `engine_version`; subirla no reescribe planes ya generados.
- **Logs:** no registres contraseñas ni datos de salud.

## 8. Límites conocidos del MVP

- Sin verificación de correo ni recuperación de contraseña: no hay proveedor de correo
  (decisión registrada en el brief).
- La CSP usa `'unsafe-inline'` en `script-src` porque React Router emite scripts inline de
  hidratación. Endurecerla con nonces es el siguiente paso; hoy ya bloquea orígenes externos,
  `frame-ancestors` y `object-src`.
- No hay pruebas de navegador automatizadas: los flujos críticos se revisan a mano en móvil y
  escritorio.
- Falta la revisión profesional del catálogo y del motor antes del lanzamiento.

## 9. Problemas típicos

| Síntoma | Causa probable |
|---|---|
| El contenedor arranca y muere | `DATABASE_URL` mal formada o base inalcanzable desde la red de Docker |
| Login en bucle o «sesión no válida» | `BETTER_AUTH_URL` no coincide con el origen real, o es `http` en producción |
| Migraciones fallan en pre-despliegue | El servicio de PostgreSQL aún no está listo o falta `drizzle/` en la imagen |
| El navegador insiste en HTTPS en local | HSTS quedó cacheado de un despliegue de producción en ese dominio; usa otro dominio para pruebas |
| Plan vacío tras generar | El seed no se corrió en ese entorno |
