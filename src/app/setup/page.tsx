import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { UsernameForm } from "./username-form";

export default async function SetupPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");
  if (session.user.username) redirect(`/u/${session.user.username}`);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">✨</div>
          <h1 className="text-2xl font-bold text-slate-100">
            Pick your username
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Your profile will live at{" "}
            <span className="text-emerald-400">
              significanthobbies.com/u/username
            </span>
          </p>
        </div>
        <UsernameForm />
      </div>
    </div>
  );
}
