"use client";
// cspell:ignore Realtime supabase
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type LoanUpdate = Record<string, unknown>;

export function RealtimeBridge({ onUpdate }:{ onUpdate:(p: LoanUpdate)=>void }) {
  useEffect(() => {
    const ch = supabase.channel("library")
      .on("broadcast", { event: "loan:update" }, (msg: { payload: LoanUpdate }) => onUpdate(msg.payload))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [onUpdate]);
  return null;
}
