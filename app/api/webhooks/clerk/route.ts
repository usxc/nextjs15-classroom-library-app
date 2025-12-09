// app/api/webhooks/clerk/route.ts
import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// UserCreatedEventの型を定義
type UserCreatedEvent = { 
  type: "user.created";
  data: {
    id: string 
  };
};

// Webhookが持っていそうな最低限の型を定義
type ClerkEvent = {
  type?: unknown;
  data?: {
    id?: unknown;
  };
};

/**
 * Webhookで飛んできたイベントが
 * 「Clerkの user.created イベント」かどうかをチェックする関数
 */
function isUserCreatedEvent(evt: unknown): evt is UserCreatedEvent {
  // まずはオブジェクトかどうか
  if (!evt || typeof evt !== "object") {
    return false;
  }

  // ClerkEvent として扱う
  const e = evt as ClerkEvent;

  // type が "user.created" 以外なら対象外
  if (e.type !== "user.created") {
    return false;
  }

  // data.id が文字列ならOK
  return typeof e.data?.id === "string";
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
