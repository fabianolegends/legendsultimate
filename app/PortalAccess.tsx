"use client";

import { usePathname } from "next/navigation";

export default function PortalAccess(){
  const pathname=usePathname();
  if(pathname.startsWith("/passport")||pathname.startsWith("/acesso"))return null;
  const className=pathname==="/"?"global-portal-access global-portal-home":"global-portal-access";
  return <a className={className} href="/acesso">Atleta / Organizador</a>;
}
