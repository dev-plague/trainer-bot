import type { Config } from "@react-router/dev/config";

export default {
  // La app se renderiza en el servidor (Node). Ver docs/adr/0001-stack-inicial.md.
  ssr: true,
} satisfies Config;
