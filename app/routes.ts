import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("features/onboarding/ui/welcome.tsx"),
  route("registro", "features/auth/ui/register.tsx"),
  route("entrar", "features/auth/ui/login.tsx"),
  route("consentimiento", "features/onboarding/ui/consent.tsx"),
  route("onboarding", "features/onboarding/ui/onboarding.tsx"),
  route("perfil", "features/onboarding/ui/profile-details.tsx"),
  route("salud", "features/onboarding/ui/health-screening.tsx"),
  route("imc", "features/bmi/ui/bmi-screen.tsx"),
  route("ejercicios/:slug", "features/exercises/ui/exercise-detail.tsx"),
  route("ajustes", "features/onboarding/ui/settings.tsx"),
  route("cuenta", "features/auth/ui/account.tsx"),
  route("api/auth/*", "features/auth/ui/auth-handler.ts"),
] satisfies RouteConfig;
