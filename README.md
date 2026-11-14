# Trainerbot

Entrenador personal sincero, cercano y con objetivos claros. Genera un plan de
entrenamiento ajustado a cada persona y la acompaña a integrar el ejercicio en su rutina.
Web, mobile first y responsive.

**Trainerbot no es una IA.** Es un programa determinista: recibe datos por formularios y
aplica reglas sobre un catálogo curado de ejercicios. No hay chat ni LLM.

## Estado

**MVP entregado** (13 de noviembre de 2026). Todo el alcance del brief (§2) está implementado
y mergeado en `main`:

- Cuenta con Better Auth (correo y contraseña), consentimientos y borrado inmediato.
- Onboarding con nombre preferido, forma de trato, perfil y cuestionario PAR-Q.
- IMC explicado solo para mayores de 18, con rango saludable y meta intermedia.
- Catálogo curado de 52 entradas (44 ejercicios y 8 pasos de movilidad), con fuente, ficha de
  detalle y equivalencias.
- Motor determinista (`engine_version` 3): perfiles por objetivo, segmentación por días,
  cascada de equipo y modo flexible.
- Sesión guiada con calentamiento y enfriamiento, progreso reanudable y regresión.

Queda el despliegue y, antes de abrirlo al público, la revisión profesional del catálogo y del
motor. El estado por épica está en [el backlog](docs/product/backlog.md).

## Empezar

Requiere Bun y Docker.

```bash
bun install
cp .env.example .env
docker compose up -d     # PostgreSQL en localhost:5433
bun run dev              # http://localhost:5173
```

`.env` no se versiona; el ejemplo trae credenciales solo para desarrollo.

## Documentación

- [Brief de producto](docs/product/brief.md): el **qué** y el **por qué**. Fuente de verdad.
- [Guía para agentes y desarrolladores](AGENTS.md): stack, reglas de dominio y flujo de trabajo.
- [Despliegue](docs/deployment.md): imagen, variables, migraciones y Dokploy.

## Flujo de trabajo

Todo cambio sigue: **issue → rama → PR → CI verde → merge por dev-plague**. El detalle
(ramas, commits, comandos y qué revisa un revisor) está en [CONTRIBUTING.md](CONTRIBUTING.md).
