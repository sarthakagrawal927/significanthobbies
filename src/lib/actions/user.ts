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

export async function setUsername(username: string, birthYear?: number) {
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
    data: { username: parsed, ...(birthYear ? { birthYear } : {}) },
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

export async function toggleFollow(
  targetUserId: string,
): Promise<{ following: boolean; followerCount: number }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  const currentUserId = session.user.id;

  if (currentUserId === targetUserId) {
    throw new Error("Cannot follow yourself");
  }

  const existing = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
  } else {
    await db.follow.create({
      data: { followerId: currentUserId, followingId: targetUserId },
    });
  }

  const followerCount = await db.follow.count({
    where: { followingId: targetUserId },
  });

  // Revalidate the target user's profile page
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  });
  if (targetUser?.username) {
    revalidatePath(`/u/${targetUser.username}`);
  }

  return { following: !existing, followerCount };
}

export async function updateProfile(data: {
  bio?: string;
  website?: string;
  name?: string;
}): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Validate website format if provided
  if (data.website && data.website.trim() !== "") {
    if (!/^https?:\/\/.+/.test(data.website.trim())) {
      throw new Error("Website must start with http:// or https://");
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.website !== undefined
        ? { website: data.website.trim() || null }
        : {}),
    },
  });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  if (user?.username) {
    revalidatePath(`/u/${user.username}`);
  }
  revalidatePath("/settings");
}

export async function syncQuestProgress(completedQuests: string[], earnedBadges: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db.user.update({
    where: { id: session.user.id },
    data: {
      completedQuests: JSON.stringify(completedQuests),
      earnedBadges: JSON.stringify(earnedBadges),
    },
  });
}

export async function getQuestProgress(): Promise<{ completedQuests: string[]; earnedBadges: string[] }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { completedQuests: [], earnedBadges: [] };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { completedQuests: true, earnedBadges: true },
  });

  if (!user) return { completedQuests: [], earnedBadges: [] };

  return {
    completedQuests: JSON.parse(user.completedQuests as string) as string[],
    earnedBadges: JSON.parse(user.earnedBadges as string) as string[],
  };
}
