import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { NavSignOut } from "./nav-sign-out";

export async function Nav() {
  const session = await getServerAuthSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          SignificantHobbies
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/hobbies">
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-500 hover:text-stone-700"
            >
              Discover
            </Button>
          </Link>
          <Link href="/explore">
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-500 hover:text-stone-700"
            >
              Explore
            </Button>
          </Link>

          {session?.user ? (
            <>
              <Link href="/timeline/new">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  New Timeline
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image ?? ""} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                        {session.user.name?.[0] ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 border-stone-200 bg-white"
                >
                  {session.user.username ? (
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${session.user.username}`}>
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/setup" className="text-yellow-600">
                        Set username →
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-stone-200" />
                  <NavSignOut />
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                variant="outline"
                className="border-stone-300 text-stone-600 hover:text-stone-900"
              >
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
