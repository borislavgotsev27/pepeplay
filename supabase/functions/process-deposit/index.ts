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
    console.log("DEBUG: Incoming request body:", body);

    const { user_id, amount, currency, wallet_address } = body;

    if (!user_id) throw new Error("Missing required field: user_id");

    const OXAPAY_MERCHANT_API_KEY = Deno.env.get("OXAPAY_MERCHANT_API_KEY");
    if (!OXAPAY_MERCHANT_API_KEY) throw new Error("OxaPay Merchant API key not set");

    if (amount && currency) {
      console.log("DEBUG: Creating deposit wallet:", { amount, currency });

      const res = await fetch("https://api.oxapay.com/merchants/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchant: OXAPAY_MERCHANT_API_KEY,
          amount: amount,
          currency: currency,
          lifeTime: 30,
          feePaidByPayer: 0,
          underPaidCover: 2,
          callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-usdt-transaction`,
          returnUrl: `${Deno.env.get("VITE_SUPABASE_URL")}/dashboard`,
          description: `Deposit by user ${user_id}`,
          orderId: `DEP-${user_id}-${Date.now()}`,
        }),
      });

      const data = await res.json();
      console.log("DEBUG: OxaPay merchant response:", data);

      if (!res.ok || data.result !== 100) {
        throw new Error(data.message || "Failed to create deposit wallet");
      }

      return new Response(
        JSON.stringify({
          success: true,
          wallet_address: data.payLink,
          currency: currency,
          trackId: data.trackId,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (wallet_address) {
      console.log("DEBUG: Checking deposit status for:", wallet_address);

      const res = await fetch("https://api.oxapay.com/merchants/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchant: OXAPAY_MERCHANT_API_KEY,
          trackId: wallet_address,
        }),
      });

      const data = await res.json();
      console.log("DEBUG: OxaPay inquiry response:", data);

      if (!res.ok || data.result !== 100) {
        throw new Error(data.message || "Failed to check deposit status");
      }

      if (data.status === "Paid" || data.status === "Confirming") {
        const depositAmount = parseFloat(data.payAmount);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user_id)
          .maybeSingle();

        if (profileError) throw profileError;

        const newBalance = (profileData?.balance || 0) + depositAmount;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("id", user_id);

        if (updateError) throw updateError;

        const { error: txError } = await supabase.from("transactions").insert({
          user_id: user_id,
          type: "deposit",
          amount: depositAmount,
          status: "completed",
          wallet_address: data.payCurrency,
          transaction_hash: data.trackId,
        });

        if (txError) throw txError;

        return new Response(
          JSON.stringify({
            success: true,
            amount: depositAmount,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: "Deposit not yet confirmed",
          status: data.status,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    throw new Error("Missing required fields: amount/currency or wallet_address");
  } catch (err: any) {
    console.error("Deposit error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
