import { createConfig, http } from 'wagmi'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'

// WalletConnect Project ID - you can get this from https://cloud.walletconnect.com
const projectId = '82a4c08ff74d0d6b58ae56c19d8e9f66' // Replace with your actual project ID

export const config = createConfig({
  chains: [mainnet, polygon, bsc],
  connectors: [
    walletConnect({
      projectId,
      metadata: {
        name: 'PEPE Game',
        description: 'Play and earn USDT with PEPE Game',
        url: window.location.origin,
        icons: ['https://pepe-game.com/icon.png']
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
})
