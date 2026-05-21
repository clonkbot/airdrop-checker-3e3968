import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { isAddress, formatEther } from 'viem'

// Mock airdrop data - in production this would come from an indexer/API
interface Airdrop {
  id: string
  protocol: string
  token: string
  amount: string
  status: 'UNCLAIMED' | 'CLAIMED' | 'EXPIRED'
  claimDeadline: string
  value: string
}

const generateMockAirdrops = (address: string): Airdrop[] => {
  // Deterministic "random" based on address for consistent results
  const seed = parseInt(address.slice(2, 10), 16)
  const protocols = [
    { name: 'BASE_BRIDGE', token: '$BASE', value: '$142.50' },
    { name: 'UNISWAP_V4', token: '$UNI', value: '$89.20' },
    { name: 'AAVE_GENESIS', token: '$AAVE', value: '$234.00' },
    { name: 'OPTIMISM_OP', token: '$OP', value: '$67.80' },
    { name: 'ARBITRUM_ARB', token: '$ARB', value: '$156.40' },
    { name: 'ZKSYNC_ZK', token: '$ZK', value: '$45.90' },
    { name: 'STARKNET_STRK', token: '$STRK', value: '$312.00' },
    { name: 'LAYERZERO_ZRO', token: '$ZRO', value: '$78.50' },
    { name: 'EIGENLAYER_EIGEN', token: '$EIGEN', value: '$445.20' },
    { name: 'SCROLL_SCR', token: '$SCR', value: '$23.40' },
  ]

  const statuses: ('UNCLAIMED' | 'CLAIMED' | 'EXPIRED')[] = ['UNCLAIMED', 'CLAIMED', 'EXPIRED']
  const amounts = ['1,250', '3,420', '890', '5,670', '2,100', '780', '4,500', '1,890', '6,230', '450']

  const numAirdrops = 3 + (seed % 6)
  const airdrops: Airdrop[] = []

  for (let i = 0; i < numAirdrops; i++) {
    const protoIndex = (seed + i * 7) % protocols.length
    const statusIndex = (seed + i * 3) % 3
    const amountIndex = (seed + i * 5) % amounts.length

    airdrops.push({
      id: `${address.slice(0, 8)}-${i}`,
      protocol: protocols[protoIndex].name,
      token: protocols[protoIndex].token,
      amount: amounts[amountIndex],
      status: statuses[statusIndex],
      claimDeadline: statusIndex === 2 ? '2024-01-15' : '2025-06-30',
      value: protocols[protoIndex].value,
    })
  }

  return airdrops
}

function AirdropRow({ airdrop, index }: { airdrop: Airdrop; index: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 80)
    return () => clearTimeout(timer)
  }, [index])

  const statusStyles = {
    UNCLAIMED: 'bg-[#00FF00] text-black',
    CLAIMED: 'bg-[#888] text-black',
    EXPIRED: 'bg-[#FF0000] text-white',
  }

  return (
    <div
      className={`border-2 border-black transition-all duration-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-6 border-b-2 border-black last:border-b-0">
        <div className="p-3 md:p-4 border-b-2 md:border-b-0 md:border-r-2 border-black font-mono text-xs md:text-sm font-bold bg-[#f0f0f0]">
          {airdrop.protocol}
        </div>
        <div className="p-3 md:p-4 border-b-2 md:border-b-0 md:border-r-2 border-black font-mono text-xs md:text-sm flex items-center justify-between md:justify-start">
          <span className="md:hidden font-bold">TOKEN:</span>
          {airdrop.token}
        </div>
        <div className="p-3 md:p-4 border-b-2 md:border-b-0 md:border-r-2 border-black font-mono text-xs md:text-sm flex items-center justify-between md:justify-start">
          <span className="md:hidden font-bold">AMOUNT:</span>
          {airdrop.amount}
        </div>
        <div className="p-3 md:p-4 border-b-2 md:border-b-0 md:border-r-2 border-black font-mono text-xs md:text-sm flex items-center justify-between md:justify-start">
          <span className="md:hidden font-bold">VALUE:</span>
          {airdrop.value}
        </div>
        <div className="p-3 md:p-4 border-b-2 md:border-b-0 md:border-r-2 border-black font-mono text-xs flex items-center justify-between md:justify-start">
          <span className="md:hidden font-bold">DEADLINE:</span>
          {airdrop.claimDeadline}
        </div>
        <div className="p-3 md:p-4 flex items-center justify-between md:justify-center">
          <span className="md:hidden font-bold font-mono text-xs">STATUS:</span>
          <span className={`px-2 py-1 font-mono text-[10px] md:text-xs font-black ${statusStyles[airdrop.status]}`}>
            {airdrop.status}
          </span>
        </div>
      </div>
    </div>
  )
}

function WalletInfo({ address }: { address: `0x${string}` }) {
  const { data: balance } = useBalance({ address })

  return (
    <div className="border-2 border-black bg-[#FFFF00] p-3 md:p-4 mb-4 md:mb-6">
      <div className="font-mono text-xs md:text-sm">
        <span className="font-black">CONNECTED:</span>{' '}
        <span className="break-all">{address}</span>
      </div>
      {balance && (
        <div className="font-mono text-xs md:text-sm mt-1">
          <span className="font-black">BALANCE:</span> {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
        </div>
      )}
    </div>
  )
}

function AirdropChecker() {
  const [inputAddress, setInputAddress] = useState('')
  const [searchedAddress, setSearchedAddress] = useState('')
  const [airdrops, setAirdrops] = useState<Airdrop[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { address: connectedAddress, isConnected } = useAccount()

  const handleCheck = () => {
    setError('')

    if (!inputAddress.trim()) {
      setError('ADDRESS_REQUIRED')
      return
    }

    if (!isAddress(inputAddress)) {
      setError('INVALID_ADDRESS_FORMAT')
      return
    }

    setIsLoading(true)
    setSearchedAddress(inputAddress)
    setAirdrops([])

    // Simulate API call
    setTimeout(() => {
      const results = generateMockAirdrops(inputAddress)
      setAirdrops(results)
      setIsLoading(false)
    }, 800)
  }

  const handleUseConnected = () => {
    if (connectedAddress) {
      setInputAddress(connectedAddress)
    }
  }

  const unclaimedCount = airdrops.filter((a) => a.status === 'UNCLAIMED').length
  const claimedCount = airdrops.filter((a) => a.status === 'CLAIMED').length
  const expiredCount = airdrops.filter((a) => a.status === 'EXPIRED').length
  const totalValue = airdrops
    .filter((a) => a.status === 'UNCLAIMED')
    .reduce((sum, a) => sum + parseFloat(a.value.replace('$', '').replace(',', '')), 0)

  return (
    <div className="w-full max-w-5xl mx-auto">
      {isConnected && connectedAddress && <WalletInfo address={connectedAddress} />}

      {/* Input Section */}
      <div className="border-4 border-black mb-6 md:mb-8">
        <div className="bg-black text-white p-3 md:p-4 font-mono text-sm md:text-lg font-black tracking-wider">
          ENTER_WALLET_ADDRESS
        </div>
        <div className="p-4 md:p-6 bg-white">
          <div className="flex flex-col md:flex-row gap-3 md:gap-0">
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 border-4 border-black p-3 md:p-4 font-mono text-sm md:text-base focus:outline-none focus:bg-[#f5f5f5] placeholder:text-gray-400"
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            />
            <button
              onClick={handleCheck}
              disabled={isLoading}
              className="border-4 border-black border-l-4 md:border-l-0 bg-[#00FF00] hover:bg-[#00CC00] active:bg-[#009900] px-6 md:px-8 py-3 md:py-4 font-mono font-black text-sm md:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'SCANNING...' : 'CHECK'}
            </button>
          </div>

          {isConnected && (
            <button
              onClick={handleUseConnected}
              className="mt-3 border-2 border-black bg-[#FFFF00] hover:bg-[#DDDD00] px-4 py-2 font-mono text-xs font-bold transition-colors w-full md:w-auto"
            >
              USE_CONNECTED_WALLET
            </button>
          )}

          {error && (
            <div className="mt-4 border-2 border-[#FF0000] bg-[#FF0000] text-white p-3 font-mono text-xs md:text-sm font-bold">
              ERROR: {error}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {isLoading && (
        <div className="border-4 border-black p-8 md:p-12 text-center">
          <div className="font-mono text-lg md:text-2xl font-black animate-pulse">
            SCANNING_BLOCKCHAIN...
          </div>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-3 h-3 md:w-4 md:h-4 bg-black animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && airdrops.length > 0 && (
        <div className="border-4 border-black">
          <div className="bg-black text-white p-3 md:p-4 font-mono text-sm md:text-lg font-black tracking-wider flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <span>RESULTS_FOR:</span>
            <span className="text-[#00FF00] text-xs md:text-sm break-all">{searchedAddress}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b-4 border-black">
            <div className="p-4 md:p-6 border-b-2 md:border-b-0 border-r-2 border-black text-center">
              <div className="font-mono text-2xl md:text-4xl font-black text-[#00FF00]">{unclaimedCount}</div>
              <div className="font-mono text-[10px] md:text-xs font-bold mt-1">UNCLAIMED</div>
            </div>
            <div className="p-4 md:p-6 border-b-2 md:border-b-0 md:border-r-2 border-black text-center">
              <div className="font-mono text-2xl md:text-4xl font-black text-[#888]">{claimedCount}</div>
              <div className="font-mono text-[10px] md:text-xs font-bold mt-1">CLAIMED</div>
            </div>
            <div className="p-4 md:p-6 border-r-2 border-black text-center">
              <div className="font-mono text-2xl md:text-4xl font-black text-[#FF0000]">{expiredCount}</div>
              <div className="font-mono text-[10px] md:text-xs font-bold mt-1">EXPIRED</div>
            </div>
            <div className="p-4 md:p-6 text-center bg-[#00FF00]">
              <div className="font-mono text-2xl md:text-4xl font-black">${totalValue.toFixed(0)}</div>
              <div className="font-mono text-[10px] md:text-xs font-bold mt-1">CLAIMABLE</div>
            </div>
          </div>

          {/* Table Header - Desktop only */}
          <div className="hidden md:grid md:grid-cols-6 border-b-4 border-black bg-[#e0e0e0]">
            <div className="p-3 border-r-2 border-black font-mono text-xs font-black">PROTOCOL</div>
            <div className="p-3 border-r-2 border-black font-mono text-xs font-black">TOKEN</div>
            <div className="p-3 border-r-2 border-black font-mono text-xs font-black">AMOUNT</div>
            <div className="p-3 border-r-2 border-black font-mono text-xs font-black">VALUE</div>
            <div className="p-3 border-r-2 border-black font-mono text-xs font-black">DEADLINE</div>
            <div className="p-3 font-mono text-xs font-black text-center">STATUS</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y-2 md:divide-y-0 divide-black">
            {airdrops.map((airdrop, index) => (
              <AirdropRow key={airdrop.id} airdrop={airdrop} index={index} />
            ))}
          </div>

          {/* Warning for unclaimed */}
          {unclaimedCount > 0 && (
            <div className="border-t-4 border-black bg-[#FFFF00] p-4 md:p-6">
              <div className="font-mono text-xs md:text-sm font-black">
                ⚠ WARNING: YOU_HAVE_{unclaimedCount}_UNCLAIMED_AIRDROPS_WORTH_${totalValue.toFixed(0)}
              </div>
              <div className="font-mono text-[10px] md:text-xs mt-2 opacity-70">
                CLAIM_BEFORE_DEADLINE_OR_FUNDS_WILL_BE_LOST
              </div>
            </div>
          )}
        </div>
      )}

      {!isLoading && searchedAddress && airdrops.length === 0 && (
        <div className="border-4 border-black p-8 md:p-12 text-center">
          <div className="font-mono text-xl md:text-2xl font-black">NO_AIRDROPS_FOUND</div>
          <div className="font-mono text-xs md:text-sm mt-2 opacity-70">
            THIS_ADDRESS_HAS_NO_ELIGIBLE_AIRDROPS
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-mono text-2xl md:text-4xl font-black tracking-tighter">
              AIRDROP_CHECKER
            </h1>
            <p className="font-mono text-xs md:text-sm mt-1 opacity-60">
              SCAN_ANY_WALLET_FOR_CLAIMABLE_TOKENS
            </p>
          </div>
          <div className="self-start md:self-auto">
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Info Bar */}
      <div className="bg-black text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap font-mono text-xs md:text-sm">
          <span className="mx-4">◼ NO_WALLET_CONNECT_REQUIRED</span>
          <span className="mx-4">◼ PASTE_ANY_ADDRESS</span>
          <span className="mx-4">◼ CHECK_CLAIMED_&_UNCLAIMED</span>
          <span className="mx-4">◼ BASE_CHAIN</span>
          <span className="mx-4">◼ FREE_TO_USE</span>
          <span className="mx-4">◼ NO_WALLET_CONNECT_REQUIRED</span>
          <span className="mx-4">◼ PASTE_ANY_ADDRESS</span>
          <span className="mx-4">◼ CHECK_CLAIMED_&_UNCLAIMED</span>
          <span className="mx-4">◼ BASE_CHAIN</span>
          <span className="mx-4">◼ FREE_TO_USE</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12">
        <AirdropChecker />
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-mono text-[10px] md:text-xs text-gray-500">
            Requested by @Nishant293 · Built by @clonkbot
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default App
