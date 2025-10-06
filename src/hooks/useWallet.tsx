import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { toast } from 'sonner'

export const useWallet = () => {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({
    address,
  })

  const connectWallet = async () => {
    try {
      const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
      if (walletConnectConnector) {
        connect({ connector: walletConnectConnector })
      } else {
        toast.error('WalletConnect not available')
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      toast.error('Failed to connect wallet')
    }
  }

  const disconnectWallet = () => {
    disconnect()
    toast.success('Wallet disconnected')
  }

  return {
    address,
    isConnected,
    chain,
    balance,
    connectWallet,
    disconnectWallet,
    isPending,
    error,
  }
}
