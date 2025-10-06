import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("VITE_SUPABASE_URL")!,
  Deno.env.get("VITE_SUPABASE_SERVICE_KEY")!
);

serve(async (req) => {
  try {
    const body = await req.json();
    const { amount, wallet_address, user_id } = body;

    if (!amount || !wallet_address || !user_id)
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });

    const OXAPAY_PAYOUT_API_KEY = Deno.env.get("OXAPAY_PAYOUT_API_KEY");
    if (!OXAPAY_PAYOUT_API_KEY) throw new Error("OxaPay Payout API key missing");

    // --- INITIATE Payout ---
    const payoutRes = await fetch("https://api.oxapay.io/v1/payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Oxapay-Api-Key": OXAPAY_PAYOUT_API_KEY,
      },
      body: JSON.stringify({ amount, wallet_address }),
    });

    const payoutData = await payoutRes.json();

    // --- IMMEDIATE FAILURE ---
    if (!payoutRes.ok || payoutData.error) {
      return new Response(
        JSON.stringify({ success: false, error: payoutData.error || "Payout failed" }),
        { status: 400 }
      );
    }

    // --- Record transaction as pending ---
    const track_id = payoutData.track_id || null;

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id,
      type: "withdrawal",
      amount,
      wallet_address,
      status: "pending",
      track_id,
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, status: "pending", track_id }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Withdrawal error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
});
