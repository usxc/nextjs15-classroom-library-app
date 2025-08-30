// app/api/webhooks/clerk/route.ts
import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type UserCreatedEvent = { type: "user.created"; data: { id: string } };
type ClerkEvent = { type: string; data?: unknown };

function isUserCreatedEvent(evt: unknown): evt is UserCreatedEvent {
  if (!evt || typeof evt !== "object") return false;
  const e = evt as ClerkEvent;
  if (e.type !== "user.created") return false;
  const d = (e as { data?: unknown }).data;
  return !!d && typeof (d as { id?: unknown }).id === "string";
}

export async function POST(req: Request) {
  const payload = await req.text();
  const h = await headers();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: unknown;
  try {
    evt = wh.verify(payload, {
      "svix-id": h.get("svix-id")!,
      "svix-timestamp": h.get("svix-timestamp")!,
      "svix-signature": h.get("svix-signature")!,
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (isUserCreatedEvent(evt)) {
    const userId = evt.data.id; // ← Clerkの userId
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, role: "STUDENT" },
    });
  }

  return new Response("ok", { status: 200 });
}
