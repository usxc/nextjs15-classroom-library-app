"use client";
// cspell:ignore Supabase supabase Realtime
import { useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";

type LoanUpdate = { copyId: string; status: "AVAILABLE" | "LOANED" | "LOST" | "REPAIR" };

export function RealtimeBridge({ onUpdate }:{ onUpdate:(p: LoanUpdate)=>void }) {
  const { session } = useSession();

  const supabase = useMemo(() => {
    if (!session) return null;

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        // ClerkのセッショントークンをSupabaseへ渡す（Supabase公式のThird-party auth）
        accessToken: async () => session.getToken() ?? null,
      }
    );
  }, [session]);

  useEffect(() => {
    if (!supabase) return;

    const ch = supabase
      .channel("library", { config: { private: true } }) // RLSを効かせるために private channel にする
      .on("broadcast", { event: "loan:update" }, (msg: { payload: LoanUpdate }) => {
        onUpdate(msg.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, onUpdate]);

  return null;
}