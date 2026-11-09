import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ATHLETE_PHOTO_COOKIE,
  readAthletePhotoSession,
} from "@/lib/athlete-photo-auth";

export default async function AthletePhotosLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const session = readAthletePhotoSession(cookieStore.get(ATHLETE_PHOTO_COOKIE)?.value);
  if (!session) redirect("/passport/acesso");
  return children;
}
