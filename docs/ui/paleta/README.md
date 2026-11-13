# Paleta Arcilla y pino

Capturas del cambio de tema visual (#87). La app se abrió con un usuario de prueba con
plan flexible, sesión en curso y datos de IMC y cuenta.

- Móvil: 390 × 844.
- Escritorio: 1440 × 900.
- Las capturas «antes» son solo de modo claro: el tema anterior no tenía modo oscuro.
- Las capturas «después» incluyen modo claro y oscuro; el oscuro se emuló con
  `prefers-color-scheme: dark`.
- La comparación es de color, no de contenido: el plan de prueba pasó a modo flexible y
  tiene una sesión en curso, así que algunos textos cambian entre «antes» y «después».

El detalle de tokens, reglas y contraste está en
[`docs/ui/sistema-de-color.md`](../sistema-de-color.md).

## Antes y después

| Pantalla | Antes (claro) | Después (claro) | Después (oscuro) |
| --- | --- | --- | --- |
| Bienvenida | [móvil](antes/bienvenida-movil.jpg) · [escritorio](antes/bienvenida-escritorio.jpg) | [móvil](despues/bienvenida-claro-movil.jpg) · [escritorio](despues/bienvenida-claro-escritorio.jpg) | [móvil](despues/bienvenida-oscuro-movil.jpg) · [escritorio](despues/bienvenida-oscuro-escritorio.jpg) |
| Iniciar sesión | [móvil](antes/login-movil.jpg) · [escritorio](antes/login-escritorio.jpg) | [móvil](despues/login-claro-movil.jpg) · [escritorio](despues/login-claro-escritorio.jpg) | [móvil](despues/login-oscuro-movil.jpg) · [escritorio](despues/login-oscuro-escritorio.jpg) |
| Crear cuenta | [móvil](antes/registro-movil.jpg) · [escritorio](antes/registro-escritorio.jpg) | [móvil](despues/registro-claro-movil.jpg) · [escritorio](despues/registro-claro-escritorio.jpg) | [móvil](despues/registro-oscuro-movil.jpg) · [escritorio](despues/registro-oscuro-escritorio.jpg) |
| Plan | [móvil](antes/plan-movil.jpg) · [escritorio](antes/plan-escritorio.jpg) | [móvil](despues/plan-claro-movil.jpg) · [escritorio](despues/plan-claro-escritorio.jpg) | [móvil](despues/plan-oscuro-movil.jpg) · [escritorio](despues/plan-oscuro-escritorio.jpg) |
| Plan con sesión en curso | [móvil](antes/plan-en-curso-movil.jpg) · [escritorio](antes/plan-en-curso-escritorio.jpg) | [móvil](despues/plan-claro-movil.jpg) · [escritorio](despues/plan-claro-escritorio.jpg) | [móvil](despues/plan-oscuro-movil.jpg) · [escritorio](despues/plan-oscuro-escritorio.jpg) |
| Cambiar ejercicio (drawer) | [móvil](antes/cambiar-movil.jpg) · [escritorio](antes/cambiar-escritorio.jpg) | [móvil](despues/cambiar-claro-movil.jpg) · [escritorio](despues/cambiar-claro-escritorio.jpg) | [móvil](despues/cambiar-oscuro-movil.jpg) · [escritorio](despues/cambiar-oscuro-escritorio.jpg) |
| Sesión guiada | [móvil](antes/sesion-movil.jpg) · [escritorio](antes/sesion-escritorio.jpg) | [móvil](despues/sesion-claro-movil.jpg) · [escritorio](despues/sesion-claro-escritorio.jpg) | [móvil](despues/sesion-oscuro-movil.jpg) · [escritorio](despues/sesion-oscuro-escritorio.jpg) |
| IMC | [móvil](antes/imc-movil.jpg) · [escritorio](antes/imc-escritorio.jpg) | [móvil](despues/imc-claro-movil.jpg) · [escritorio](despues/imc-claro-escritorio.jpg) | [móvil](despues/imc-oscuro-movil.jpg) · [escritorio](despues/imc-oscuro-escritorio.jpg) |
| Cuenta | [móvil](antes/cuenta-movil.jpg) · [escritorio](antes/cuenta-escritorio.jpg) | [móvil](despues/cuenta-claro-movil.jpg) · [escritorio](despues/cuenta-claro-escritorio.jpg) | [móvil](despues/cuenta-oscuro-movil.jpg) · [escritorio](despues/cuenta-oscuro-escritorio.jpg) |
| Eliminar cuenta | [móvil](antes/cuenta-eliminar-movil.jpg) · [escritorio](antes/cuenta-eliminar-escritorio.jpg) | [móvil](despues/cuenta-eliminar-claro-movil.jpg) · [escritorio](despues/cuenta-eliminar-claro-escritorio.jpg) | [móvil](despues/cuenta-eliminar-oscuro-movil.jpg) · [escritorio](despues/cuenta-eliminar-oscuro-escritorio.jpg) |

El formulario de plan se revisó después del cambio:
[móvil claro](despues/plan-formulario-claro-movil.jpg),
[escritorio claro](despues/plan-formulario-claro-escritorio.jpg),
[móvil oscuro](despues/plan-formulario-oscuro-movil.jpg) y
[escritorio oscuro](despues/plan-formulario-oscuro-escritorio.jpg).

## Qué se ve

- Fondo crema cálido (`#F6F1EA`) y tarjetas marfil (`#FFFDF9`) en claro.
- Pino para estructura: navegación activa, pestañas, chips e iconos.
- Terracota para una única acción principal por pantalla y para el progreso.
- «Tu próxima sesión» con superficie pino, etiqueta arcilla suave, título claro y botón
  terracota. En oscuro usa un pino profundo para no convertirse en una masa clara.
- Avisos de seguridad en tono neutro cálido, con icono, sin rojo ni terracota.
- Modo oscuro propio, sin inversión automática, con foco visible y bordes de campo
  suficientes para distinguirlos.

Estas capturas son documentación visual, no assets del producto.
