# Bienvenida pública sobria (#91)

Capturas de la pantalla de bienvenida (`/`) antes y después del rediseño. Se tomaron con
la app en local, sin sesión (la redirección de invitado se mantiene), a 390 × 844 (móvil) y
1440 × 900 (escritorio). El modo oscuro se emuló con `prefers-color-scheme: dark`.

| Momento | Móvil | Escritorio |
| --- | --- | --- |
| Antes, claro | `antes-movil-claro.jpg` | `antes-escritorio-claro.jpg` |
| Antes, oscuro | `antes-movil-oscuro.jpg` | `antes-escritorio-oscuro.jpg` |
| Después, claro | `despues-movil-claro.jpg` | `despues-escritorio-claro.jpg` |
| Después, oscuro | `despues-movil-oscuro.jpg` | `despues-escritorio-oscuro.jpg` |

## Qué cambia

- La bienvenida deja de vender: desaparecen la tarjeta de ejemplo, el ícono y el párrafo
  largo. Quedan el wordmark con punto terracota, el enlace «Entrar», el saludo, el titular,
  una frase, el botón «Crear mi cuenta» y la línea de seguridad.
- El saludo se calcula con la hora local del navegador. El HTML del servidor y el primer
  render del cliente muestran «Hola.»; tras montar aparece «Buenos días.», «Buenas tardes.»
  o «Buenas noches.» sin mover la maquetación.
- En móvil el botón queda al final de la pantalla, sobre el área segura inferior; en
  escritorio la columna se centra con un máximo de 440 px y el botón sigue el flujo normal.
- La entrada del bloque de texto es una animación corta de opacidad y desplazamiento, y se
  desactiva con `prefers-reduced-motion: reduce`.

## Verificación

- Consola del navegador sin avisos ni errores en claro y oscuro (incluida la hidratación).
- Sin desbordamiento horizontal a 360, 390 y 1440 px; el botón mide 48 px de alto y el
  enlace «Entrar», 44 px.
- Contraste con los tokens existentes: `muted-foreground` sobre `background` da 5,08:1 en
  claro y 7,13:1 en oscuro; el botón usa `accent`/`accent-foreground`.
- Foco visible con el anillo `ring` en ambos modos.

Estas capturas son documentación visual, no assets del producto.
