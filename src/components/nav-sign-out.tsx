"use client";

import { signOut } from "next-auth/react";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";

export function NavSignOut() {
  return (
    <DropdownMenuItem
      onClick={() => signOut({ callbackUrl: "/" })}
      className="cursor-pointer text-slate-300 hover:text-white"
    >
      Sign out
    </DropdownMenuItem>
  );
}
