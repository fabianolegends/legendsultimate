"use client";

import { usePathname } from "next/navigation";

export default function PortalAccess(){
  const pathname=usePathname();
  if(pathname.startsWith("/passport")||pathname.startsWith("/acesso"))return null;
  return <a className="global-portal-access" href="/acesso">Portal</a>;
}
