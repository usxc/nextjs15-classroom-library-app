// lib/appUser.ts
import 'server-only';
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateAppUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, role: "STUDENT" },
  });
}
