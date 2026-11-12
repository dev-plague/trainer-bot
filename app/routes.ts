import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("features/onboarding/ui/welcome.tsx"),
  route("api/auth/*", "features/auth/ui/auth-handler.ts"),
] satisfies RouteConfig;
