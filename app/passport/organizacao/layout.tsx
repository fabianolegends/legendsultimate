import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-auth";
import OrganizationShell from "./OrganizationShell";

export default async function OrganizationLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!verifyAdminSession(session)) redirect("/passport/organizacao-acesso");
  return <OrganizationShell>{children}</OrganizationShell>;
}
