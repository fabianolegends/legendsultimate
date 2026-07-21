import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AthleteLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get("rwgps_user")?.value || !cookieStore.get("rwgps_access_token")?.value) {
    redirect("/passport/acesso");
  }
  return children;
}
