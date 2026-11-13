# Trainerbot

Entrenador personal sincero, cercano y con objetivos claros. Genera un plan de
entrenamiento ajustado a cada persona y la acompaña a integrar el ejercicio en su rutina.
Web, mobile first y responsive.

**Trainerbot no es una IA.** Es un programa determinista: recibe datos por formularios y
aplica reglas sobre un catálogo curado de ejercicios. No hay chat ni LLM.

## Estado

Iteración 1 — fundaciones: scaffolding de React Router, base de datos y CI. Todavía no hay
producto usable.

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
