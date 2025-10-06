import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { score, earnings } = await req.json();

    if (!earnings || earnings <= 0) {
      throw new Error('Invalid earnings amount');
    }

    console.log('Recording game earning:', { user_id: user.id, score, earnings });

    // Create game earning transaction
    const { error: txError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'game_earning',
        amount: earnings,
        status: 'completed',
        notes: `Game score: ${score}`
      });

    if (txError) throw txError;

    // Update user balance and total earnings
    const { data: currentProfile } = await supabaseClient
      .from('profiles')
      .select('balance, total_earnings')
      .eq('id', user.id)
      .single();

    if (currentProfile) {
      const { error: balanceError } = await supabaseClient
        .from('profiles')
        .update({
          balance: (currentProfile.balance || 0) + earnings,
          total_earnings: (currentProfile.total_earnings || 0) + earnings
        })
        .eq('id', user.id);

      if (balanceError) throw balanceError;
    }

    // Distribute referral bonuses (10%, 5%, 2% for levels 1, 2, 3)
    const { error: referralError } = await supabaseClient.rpc('distribute_referral_bonus', {
      p_user_id: user.id,
      p_amount: earnings,
      p_source_type: 'game_earnings'
    });

    if (referralError) {
      console.error('Error distributing referral bonus:', referralError);
      // Don't throw - we still want to credit the user even if referral fails
    }

    // Get updated balance
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('balance, total_earnings')
      .eq('id', user.id)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true,
        earnings,
        new_balance: profile?.balance || 0,
        total_earnings: profile?.total_earnings || 0,
        message: 'Earnings credited successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Game earning error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
