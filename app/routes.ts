import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("features/onboarding/ui/welcome.tsx"),
  route("registro", "features/auth/ui/register.tsx"),
  route("entrar", "features/auth/ui/login.tsx"),
  route("consentimiento", "features/onboarding/ui/consent.tsx"),
  route("cuenta", "features/auth/ui/account.tsx"),
  route("api/auth/*", "features/auth/ui/auth-handler.ts"),
] satisfies RouteConfig;
