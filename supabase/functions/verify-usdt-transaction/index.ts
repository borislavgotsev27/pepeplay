import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationRequest {
  transaction_hash: string
  wallet_address: string
  expected_amount: number
  chain_id: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { transaction_hash, wallet_address, expected_amount, chain_id } = await req.json() as VerificationRequest

    console.log('Verifying transaction:', { transaction_hash, wallet_address, expected_amount, chain_id })

    // USDT Contract addresses on different chains
    const USDT_CONTRACTS: Record<number, string> = {
      1: '0xdac17f958d2ee523a2206206994597c13d831ec7', // Ethereum Mainnet
      56: '0x55d398326f99059fF775485246999027B3197955', // BSC
      137: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // Polygon
    }

    const usdtContract = USDT_CONTRACTS[chain_id]
    if (!usdtContract) {
      throw new Error(`Unsupported chain ID: ${chain_id}`)
    }

    // Get RPC URL based on chain
    const getRpcUrl = (chainId: number): string => {
      switch (chainId) {
        case 1: return `https://eth-mainnet.g.alchemy.com/v2/${Deno.env.get('ALCHEMY_API_KEY') || 'demo'}`
        case 56: return 'https://bsc-dataseed1.binance.org'
        case 137: return 'https://polygon-rpc.com'
        default: throw new Error('Unsupported chain')
      }
    }

    // Verify transaction on blockchain
    const rpcUrl = getRpcUrl(chain_id)
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [transaction_hash],
      }),
    })

    const txData = await response.json()
    console.log('Transaction data:', txData)

    if (!txData.result) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not found on blockchain' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const tx = txData.result

    // Verify transaction details
    const isValid = 
      tx.to?.toLowerCase() === usdtContract.toLowerCase() &&
      tx.from?.toLowerCase() === wallet_address.toLowerCase()

    // Get transaction receipt to check if confirmed
    const receiptResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [transaction_hash],
      }),
    })

    const receiptData = await receiptResponse.json()
    const receipt = receiptData.result

    if (!receipt || receipt.status !== '0x1') {
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not confirmed or failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Decode USDT transfer amount from logs (simplified - in production use proper ABI decoding)
    const transferEvent = receipt.logs.find((log: any) => 
      log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    )

    if (!transferEvent) {
      return new Response(
        JSON.stringify({ success: false, error: 'No transfer event found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // USDT uses 6 decimals
    const amount = parseInt(transferEvent.data, 16) / 1e6

    console.log('Decoded amount:', amount)

    if (Math.abs(amount - expected_amount) > 0.01) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Amount mismatch. Expected: ${expected_amount}, Got: ${amount}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: isValid,
        amount,
        confirmations: parseInt(receipt.confirmations || '0', 16)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Verification error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
