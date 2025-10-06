import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    console.log("DEBUG: Withdrawal request:", body);

    const { amount, wallet_address, user_id } = body;

    if (!amount || !wallet_address || !user_id) {
      throw new Error("Missing required fields: amount, wallet_address, or user_id");
    }

    const withdrawalAmount = parseFloat(amount);
    const withdrawalFee = withdrawalAmount * 0.02;
    const totalDeduction = withdrawalAmount + withdrawalFee;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user_id)
      .maybeSingle();

    if (profileError) throw profileError;

    const currentBalance = profileData?.balance || 0;

    if (currentBalance < totalDeduction) {
      throw new Error(
        `Insufficient balance. Required: $${totalDeduction.toFixed(2)} (including 2% fee), Available: $${currentBalance.toFixed(2)}`
      );
    }

    const OXAPAY_PAYOUT_API_KEY = Deno.env.get("OXAPAY_PAYOUT_API_KEY");
    if (!OXAPAY_PAYOUT_API_KEY) throw new Error("OxaPay Payout API key missing");

    const payoutRes = await fetch("https://api.oxapay.com/payout/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: OXAPAY_PAYOUT_API_KEY,
        currency: "USDT_TRX",
        amount: withdrawalAmount,
        address: wallet_address,
        callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-usdt-transaction`,
      }),
    });

    const payoutData = await payoutRes.json();
    console.log("DEBUG: OxaPay payout response:", payoutData);

    if (!payoutRes.ok || payoutData.result !== 100) {
      throw new Error(payoutData.message || "Payout request failed");
    }

    const newBalance = currentBalance - totalDeduction;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user_id);

    if (updateError) throw updateError;

    const { error: insertError } = await supabase.from("transactions").insert({
      user_id: user_id,
      type: "withdrawal",
      amount: withdrawalAmount,
      wallet_address: wallet_address,
      status: "completed",
      transaction_hash: payoutData.trackId || null,
    });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        status: "completed",
        track_id: payoutData.trackId,
        amount: withdrawalAmount,
        fee: withdrawalFee,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("Withdrawal error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
