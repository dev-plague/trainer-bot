import { auth } from "../server";

export async function getCurrentSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}
