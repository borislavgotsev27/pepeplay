// functions/process-deposit/index.ts
import { serve } from "std/server";

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("DEBUG: Incoming request body:", body);

    const { user_id, amount, currency, wallet_address } = body;

    if (!user_id) throw new Error("Missing required field: user_id");

    const OXAPAY_API_KEY = Deno.env.get("OXAPAY_API_KEY");
    if (!OXAPAY_API_KEY) throw new Error("OxaPay API key not set");

    // --- CREATE NEW DEPOSIT WALLET ---
    if (amount && currency) {
      console.log("DEBUG: Creating deposit wallet:", { amount, currency });

      const res = await fetch("https://api.oxapay.io/merchant/create_wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": OXAPAY_API_KEY,
        },
        body: JSON.stringify({
          amount,
          currency,
          user_reference: user_id,
        }),
      });

      const data = await res.json();
      console.log("DEBUG: OxaPay create_wallet response:", data);

      if (!res.ok || !data.wallet_address)
        throw new Error(data.error || "Failed to create deposit wallet");

      return new Response(
        JSON.stringify({
          success: true,
          wallet_address: data.wallet_address,
          currency,
        }),
        { status: 200 }
      );
    }

    // --- CHECK DEPOSIT STATUS ---
    if (wallet_address) {
      console.log("DEBUG: Verifying deposit for wallet:", wallet_address);

      const res = await fetch("https://api.oxapay.io/merchant/check_deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": OXAPAY_API_KEY,
        },
        body: JSON.stringify({ wallet_address }),
      });

      const data = await res.json();
      console.log("DEBUG: OxaPay check_deposit response:", data);

      if (!res.ok) throw new Error(data.error || "Deposit verification failed");

      if (data.confirmed) {
        // Optionally update user balance in Supabase via RPC
        // await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/update_user_balance`, { ... })

        return new Response(
          JSON.stringify({
            success: true,
            amount: data.amount,
          }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: "Deposit not yet confirmed",
        }),
        { status: 200 }
      );
    }

    throw new Error("Missing required fields: amount/currency or wallet_address");
  } catch (err: any) {
    console.error("Deposit error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400 });
  }
});
