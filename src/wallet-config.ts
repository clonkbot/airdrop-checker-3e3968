import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, mainnet } from 'wagmi/chains'

export const walletConfig = getDefaultConfig({
  appName: 'Clonk dApp',
  projectId: '92a702bd013b93653ad558ecb01c59fc',
  chains: [base, mainnet],
})
