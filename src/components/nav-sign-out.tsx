"use client";

import { signOut } from "next-auth/react";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";

export function NavSignOut() {
  return (
    <DropdownMenuItem
      onClick={() => signOut({ callbackUrl: "/" })}
      className="cursor-pointer text-stone-700 hover:text-stone-900"
    >
      Sign out
    </DropdownMenuItem>
  );
}
