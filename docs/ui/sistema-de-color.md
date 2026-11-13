# Sistema de color: Arcilla y pino

La interfaz usa una sola paleta cálida y sobria. **Todos los colores viven en
`app/app.css`**; los componentes consumen utilidades de Tailwind (`bg-card`,
`text-primary`, `bg-accent`, etc.). No se escriben hex sueltos ni clases de la
paleta anterior (`green-*`, `text-white`, `bg-black/50`…) en los componentes.

Las capturas antes/después en móvil y escritorio están en
[`docs/ui/paleta`](paleta/README.md).

## Tokens

### Modo claro

| Token | Valor | Uso |
| --- | --- | --- |
| `--background` | `#F6F1EA` | Fondo de página |
| `--card`, `--popover` | `#FFFDF9` | Tarjetas, drawers y popovers |
| `--foreground` | `#23201C` | Texto principal |
| `--muted-foreground` | `#6E655B` | Texto secundario |
| `--muted` | `#EDE5DA` | Fondos suaves, pestañas inactivas, avisos neutros |
| `--border` | `#E5DACB` | Bordes decorativos y separadores |
| `--input` | `#8F8171` | Borde de campos de formulario |
| `--primary`, `--primary-foreground` | `#0F5C5C` / `#FFFFFF` | Estructura: navegación activa, chips e iconos destacados |
| `--primary-surface`, `--primary-surface-foreground` | `#0F5C5C` / `#FFFFFF` | Superficies grandes de pino: «Tu próxima sesión» y pestaña activa del plan |
| `--accent`, `--accent-foreground` | `#B8472F` / `#FFFFFF` | Acción principal y progreso |
| `--accent-soft` | `#F6CDBE` | Texto y detalles sobre fondo pino |
| `--destructive`, `--destructive-foreground` | `#B42318` / `#FFFFFF` | Eliminar cuenta, errores y confirmaciones destructivas |
| `--ring` | `#B8472F` | Anillo de foco |
| `--secondary`, `--secondary-foreground` | `#EDE5DA` / `#23201C` | Variante secundaria de botones y badges |
| `--success` | `#0F5C5C` | Estado completado; siempre con icono o texto |
| `--overlay` | `rgb(35 32 28 / 0.55)` | Velo de diálogos y drawers |

### Modo oscuro

No es una inversión automática del claro. Se define bajo `prefers-color-scheme`
(salvo que el documento tenga `.light`) y bajo `.dark`, que permite forzarlo.

| Token | Valor |
| --- | --- |
| `--background` | `#14110F` |
| `--card`, `--popover` | `#1E1A17` |
| `--foreground` | `#F3ECE2` |
| `--muted-foreground` | `#A89E91` |
| `--muted` | `#2A2420` |
| `--border` | `#332D27` |
| `--input` | `#7A6D61` |
| `--primary`, `--primary-foreground` | `#4FB3A9` / `#0B1F1E` |
| `--primary-surface`, `--primary-surface-foreground` | `#123A3A` / `#F3ECE2` |
| `--accent`, `--accent-foreground` | `#E07A5F` / `#1A0E0A` |
| `--accent-soft` | `#F0B7A4` |
| `--destructive`, `--destructive-foreground` | `#F2877B` / `#1A0E0A` |
| `--ring` | `#E07A5F` |
| `--secondary`, `--secondary-foreground` | `#2A2420` / `#F3ECE2` |
| `--success` | `#4FB3A9` |
| `--overlay` | `rgb(0 0 0 / 0.7)` |

`--primary-surface` es el pino oscuro que se usa en bloques grandes en modo
oscuro. Evita que «Tu próxima sesión» se convierta en una masa clara sobre el
fondo, manteniendo la etiqueta en `accent-soft`, el título en
`primary-surface-foreground` y el botón en `accent`.

## Reglas de uso

1. **Un solo color de acción por pantalla.** `accent` (terracota) es el botón
   principal y la barra de progreso. `primary` (pino) es estructura. No pongas
   dos botones terracota en la misma vista; los secundarios son `outline` o
   `ghost`.
2. La tarjeta de «Tu próxima sesión» usa `primary-surface`, etiqueta
   `accent-soft`, título `primary-surface-foreground` y botón `accent`.
3. La barra de progreso usa `accent` sobre `muted`.
4. `destructive` solo para peligro: «Eliminar cuenta», errores y confirmaciones
   destructivas. No es decoración.
5. Los avisos de seguridad («Recuerda…») no son errores: usan `muted` con un
   icono, nunca rojo ni terracota.
6. El color no es el único indicador de estado: verde/rojo siempre van con icono
   o texto.
7. Los textos de interfaz siguen en `app/content/`; este documento solo cubre
   color.

## Contraste verificado (WCAG AA)

Valores calculados con la fórmula de luminancia relativa de WCAG 2.x. Texto
normal exige 4,5:1; texto grande, iconos y bordes de campo, 3:1.

| Par | Claro | Oscuro |
| --- | --- | --- |
| `foreground` / `background` | 14,43:1 | 16,03:1 |
| `foreground` / `card` | 15,96:1 | 14,73:1 |
| `muted-foreground` / `background` | 5,08:1 | 7,13:1 |
| `muted-foreground` / `card` | 5,62:1 | 6,55:1 |
| `muted-foreground` / `muted` | 4,58:1 | 5,81:1 |
| `primary-foreground` / `primary` | 7,76:1 | 6,80:1 |
| `accent-foreground` / `accent` | 5,28:1 | 6,41:1 |
| `accent-soft` / `primary-surface` | 5,32:1 | 7,10:1 |
| `primary-surface-foreground` / `primary-surface` | 7,76:1 | 10,58:1 |
| `destructive` / `background` | 5,85:1 | 7,64:1 |
| `destructive-foreground` / `destructive` | 6,57:1 | 7,67:1 |
| `input` / `card` (borde de campo) | 3,73:1 | 3,45:1 |
| `ring` / `background` (foco) | 4,70:1 | 6,37:1 |
| `accent` / `muted` (progreso) | 4,23:1 | 5,19:1 |

Ajuste anotado: en modo oscuro el borde de campo de la tabla original
(`#6B5F54`) daba 2,79:1 sobre la tarjeta. Se subió a `#7A6D61` para alcanzar
3,45:1.

Estados revisados en los componentes de shadcn: foco (anillo `ring` completo,
no translúcido), hover (usa `muted`, no `accent`), deshabilitado (opacidad 50 %,
exento de contraste por ser inactivo) y error (`destructive` con borde y anillo).

## Colores retirados

- Los `oklch(...)` verdes del tema anterior en `app/app.css`.
- `hover:bg-accent` en tarjetas, navegación y opciones: ahora `hover:bg-muted`
  para que el terracota no se use como decoración.
- `bg-accent` en skeletons, «hoy» del calendario y navegación activa: ahora
  `muted` o `primary`.
- `text-white` y `bg-black/50` en componentes: ahora `*-foreground` y
  `bg-overlay`.
- `warning` como color de avisos de seguridad: ahora `muted` con icono.

No quedaron colores del tema anterior sin migrar.

## Cómo añadir color

1. Define o reutiliza un token en `app/app.css` (claro y oscuro).
2. Mapéalo en `@theme inline` si necesitas una utilidad nueva.
3. Úsalo desde los componentes con la utilidad de Tailwind.
4. Añade el par a la tabla de contraste y verifica AA en ambos modos.
5. Actualiza este documento y, si cambia una regla, el issue/PR correspondiente.
