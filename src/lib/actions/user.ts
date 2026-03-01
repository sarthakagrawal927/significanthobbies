"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth/config";
import { db } from "~/server/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UsernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(
    /^[a-z0-9-]+$/,
    "Lowercase letters, numbers, and hyphens only",
  );

export async function setUsername(username: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const parsed = UsernameSchema.parse(username.toLowerCase());

  const existing = await db.user.findUnique({
    where: { username: parsed },
  });
  if (existing && existing.id !== session.user.id) {
    throw new Error("Username already taken");
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { username: parsed },
  });
  revalidatePath(`/u/${parsed}`);
  return user;
}

export async function getMyProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, username: true, image: true },
  });
}
