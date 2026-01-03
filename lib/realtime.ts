"use server";
// cspell:ignore Supabase supabase Realtime
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

type LoanUpdate = Record<string, unknown>;

export async function publishLoanEvent(payload: LoanUpdate) {
  const ch = supabase.channel("library", { config: { private: true } });
  await ch.send({ type: "broadcast", event: "loan:update", payload });
  await supabase.removeChannel(ch);
}