# ADRs

Registro de decisiones de arquitectura. Un ADR por decisión relevante, corto y con fecha. Si
una decisión cambia, se escribe un ADR nuevo que reemplaza al anterior; el viejo no se
reescribe.

## Formato

```md
# ADR NNNN — Título

- **Estado:** propuesto | aceptado | reemplazado por ADR NNNN
- **Fecha:** AAAA-MM-DD
- **Decisión relacionada:** issue o PR

## Contexto
Qué problema hay que resolver y qué restricciones existen.

## Decisión
Qué se elige, en presente y sin ambigüedad.

## Alternativas consideradas
Qué se descartó y por qué.

## Consecuencias
Lo bueno, lo malo y lo que habrá que revisar.
```

Reglas:

- Se escribe en la misma PR que introduce el cambio.
- Máximo una página. Si no cabe, la decisión es demasiado grande: pártela.
- No se usa para documentar cómo funciona el código; para eso está
  [`docs/architecture.md`](../architecture.md).

## Índice

| ADR | Título | Estado |
|---|---|---|
| [0001](0001-stack-inicial.md) | Stack inicial | propuesto |
| [0002](0002-calidad-y-pruebas.md) | Calidad de código y pruebas | propuesto |
