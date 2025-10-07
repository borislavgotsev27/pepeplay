# OxaPay Integration Setup Guide for Lovable Cloud

## Overview
Your deposit and withdrawal system has been configured to work with OxaPay. The code is ready, but you need to set up the API keys in your Supabase project.

## Required API Keys

You have two OxaPay API keys that need to be configured:

1. **OXAPAY_MERCHANT_API_KEY**: `8YAFTS-KKEFV0-AYHZVQ-VFMITW` (for deposits)
2. **OXAPAY_PAYOUT_API_KEY**: `9SRXFB-4TIMP1-NT8II0-TDUDH1` (for withdrawals)

## Setup Instructions

### Option 1: Via Lovable Dashboard (Recommended)

1. **Go to Lovable Project Settings**
   - Visit: https://lovable.dev/projects/fb799952-eaf2-481a-95cb-0ccca84c2ac4
   - Click on "Project" → "Settings"
   - Look for "Integrations" or "Supabase" section

2. **Access Supabase Settings**
   - In Lovable, there should be a link to your Supabase project
   - Click on it to open Supabase dashboard
   - Or go directly to: https://supabase.com/dashboard

3. **Add Edge Function Secrets**
   - In Supabase Dashboard, go to: **Project Settings** → **Edge Functions** → **Secrets**
   - Add these two secrets:
     ```
     Name: OXAPAY_MERCHANT_API_KEY
     Value: 8YAFTS-KKEFV0-AYHZVQ-VFMITW

     Name: OXAPAY_PAYOUT_API_KEY
     Value: 9SRXFB-4TIMP1-NT8II0-TDUDH1
     ```

### Option 2: Using Supabase CLI (If you have local access)

If you have Supabase CLI installed, you can set secrets with these commands:

```bash
supabase secrets set OXAPAY_MERCHANT_API_KEY=8YAFTS-KKEFV0-AYHZVQ-VFMITW
supabase secrets set OXAPAY_PAYOUT_API_KEY=9SRXFB-4TIMP1-NT8II0-TDUDH1
```

### Option 3: Through Lovable Chat

You can ask Lovable to deploy the edge functions for you:

1. In Lovable chat, say: "Deploy the edge functions process-deposit and process-withdrawal to Supabase"
2. Lovable should handle the deployment automatically

## What Has Been Fixed

### 1. Database Integration
- ✅ Updated to use `profiles` table instead of `users`
- ✅ Fixed field mapping to use `transaction_hash` for tracking OxaPay IDs
- ✅ Proper balance updates in user profiles

### 2. Deposit System (`process-deposit`)
- ✅ Creates payment links via OxaPay Merchant API
- ✅ Returns payment link to user
- ✅ Polls for payment confirmation
- ✅ Credits balance when payment is confirmed
- ✅ Records transaction in database

### 3. Withdrawal System (`process-withdrawal`)
- ✅ Validates user balance before processing
- ✅ Calculates 2% fee correctly
- ✅ Processes payout via OxaPay Payout API
- ✅ Deducts balance from user profile
- ✅ Records transaction in database

### 4. Frontend Updates
- ✅ Shows payment link instead of wallet address
- ✅ Provides clickable button to open payment page
- ✅ Extended polling timeout to 5 minutes
- ✅ Proper error handling

## Edge Functions Location

The edge functions are ready in these files:
- `/supabase/functions/process-deposit/index.ts`
- `/supabase/functions/process-withdrawal/index.ts`

## Testing the Integration

Once the secrets are set up:

1. **Test Deposit:**
   - Go to Dashboard
   - Click "Deposit"
   - Enter amount and select currency
   - Click "Generate Deposit Wallet"
   - You'll get a payment link - click to open it
   - Complete payment on OxaPay
   - Your balance should update automatically

2. **Test Withdrawal:**
   - Go to Dashboard
   - Click "Withdraw"
   - Enter your wallet address and amount
   - Submit withdrawal
   - Funds should be sent to your wallet via OxaPay

## Troubleshooting

### If deposits aren't working:
- Check that `OXAPAY_MERCHANT_API_KEY` is set correctly in Supabase Edge Function secrets
- Check browser console for errors
- Verify the edge function is deployed

### If withdrawals aren't working:
- Check that `OXAPAY_PAYOUT_API_KEY` is set correctly in Supabase Edge Function secrets
- Ensure you have sufficient balance (including 2% fee)
- Check transaction logs in Supabase

### Edge function not found error:
- The functions need to be deployed to Supabase
- Try asking Lovable to deploy them, or
- Wait for Supabase region to be available and redeploy

## Support

If you're still having issues:
1. Check the Supabase Edge Function logs for errors
2. Verify both API keys are correctly set
3. Ensure the edge functions are deployed and active
4. Test with a small amount first

## API Documentation

- OxaPay Merchant API: https://docs.oxapay.com/merchant-api
- OxaPay Payout API: https://docs.oxapay.com/payout-api
