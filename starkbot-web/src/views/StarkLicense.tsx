import { useEffect, useRef, useCallback } from 'react'
import { animate } from 'animejs'
import { Shield, Coins, Wallet, ArrowRight, ExternalLink, CheckCircle, Zap, MessageSquare, Upload, Send } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Stars } from '../components/Stars'
import { GridBackground } from '../components/GridBackground'

const CONTRACT_ADDRESS = '0xa23a42D266653846e05d8F356a52298844537472'
const BASESCAN_URL = `https://basescan.org/address/${CONTRACT_ADDRESS}`

function AnimatedLicense() {
  const cardRef = useRef<HTMLDivElement>(null)
  const sheenRef = useRef<HTMLDivElement>(null)
  const particleContainerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const scanlineRef = useRef<HTMLDivElement>(null)

  // Holographic sheen sweep
  const startSheenAnimation = useCallback(() => {
    if (!sheenRef.current) return
    const loop = () => {
      animate(sheenRef.current!, {
        translateX: ['-120%', '220%'],
        duration: 2400,
        ease: 'inOutQuad',
        onComplete: () => setTimeout(loop, 3000),
      })
    }
    setTimeout(loop, 1000)
  }, [])

  // Floating particles around the card
  const startParticles = useCallback(() => {
    if (!particleContainerRef.current) return
    const container = particleContainerRef.current
    const colors = ['#3b82f6', '#60a5fa', '#8b5cf6', '#06b6d4', '#818cf8']

    const spawnParticle = () => {
      const particle = document.createElement('div')
      const size = 2 + Math.random() * 4
      const color = colors[Math.floor(Math.random() * colors.length)]
      const side = Math.floor(Math.random() * 4)

      let startX: number, startY: number, endX: number, endY: number

      // Spawn from edges around the card
      const w = container.offsetWidth
      const h = container.offsetHeight
      switch (side) {
        case 0: // top
          startX = Math.random() * w; startY = -10
          endX = startX + (Math.random() - 0.5) * 80; endY = -60 - Math.random() * 40
          break
        case 1: // right
          startX = w + 10; startY = Math.random() * h
          endX = w + 60 + Math.random() * 40; endY = startY + (Math.random() - 0.5) * 80
          break
        case 2: // bottom
          startX = Math.random() * w; startY = h + 10
          endX = startX + (Math.random() - 0.5) * 80; endY = h + 60 + Math.random() * 40
          break
        default: // left
          startX = -10; startY = Math.random() * h
          endX = -60 - Math.random() * 40; endY = startY + (Math.random() - 0.5) * 80
          break
      }

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${startX}px;
        top: ${startY}px;
        pointer-events: none;
        box-shadow: 0 0 ${size * 3}px ${color};
      `
      container.appendChild(particle)

      animate(particle, {
        translateX: [0, endX - startX],
        translateY: [0, endY - startY],
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        duration: 1500 + Math.random() * 1500,
        ease: 'outQuad',
        onComplete: () => particle.remove(),
      })
    }

    const interval = setInterval(spawnParticle, 200)
    return () => clearInterval(interval)
  }, [])

  // Scanline sweep
  const startScanline = useCallback(() => {
    if (!scanlineRef.current) return
    const loop = () => {
      animate(scanlineRef.current!, {
        translateY: ['-100%', '500%'],
        opacity: [0, 0.6, 0],
        duration: 3000,
        ease: 'inOutSine',
        onComplete: () => setTimeout(loop, 4000),
      })
    }
    setTimeout(loop, 2000)
  }, [])

  // Card float
  const startFloat = useCallback(() => {
    if (!cardRef.current) return
    animate(cardRef.current, {
      translateY: [0, -12, 0],
      rotateX: [0, 1, 0],
      rotateY: [0, -1.5, 0],
      duration: 6000,
      ease: 'inOutSine',
      loop: true,
    })
  }, [])

  // Glow pulse
  const startGlow = useCallback(() => {
    if (!glowRef.current) return
    animate(glowRef.current, {
      opacity: [0.4, 0.8, 0.4],
      scale: [0.95, 1.05, 0.95],
      duration: 4000,
      ease: 'inOutSine',
      loop: true,
    })
  }, [])

  // Mouse tilt
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 8
      const rotateX = ((centerY - e.clientY) / (rect.height / 2)) * 5

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${parseFloat(card.style.getPropertyValue('--float-y') || '0')}px)`
    }

    const handleLeave = () => {
      card.style.transform = ''
    }

    card.addEventListener('mousemove', handleMove)
    card.addEventListener('mouseleave', handleLeave)
    return () => {
      card.removeEventListener('mousemove', handleMove)
      card.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  useEffect(() => {
    startSheenAnimation()
    startFloat()
    startGlow()
    startScanline()
    const cleanup = startParticles()
    return cleanup
  }, [startSheenAnimation, startFloat, startGlow, startScanline, startParticles])

  return (
    <div className="relative flex items-center justify-center py-8">
      {/* Outer glow */}
      <div
        ref={glowRef}
        className="absolute w-[480px] h-[320px] rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.25) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Particle container */}
      <div
        ref={particleContainerRef}
        className="absolute w-[460px] h-[300px] pointer-events-none"
      />

      {/* The license card */}
      <div
        ref={cardRef}
        className="relative w-[420px] h-[260px] rounded-2xl overflow-hidden cursor-default select-none"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Card background */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #172554 60%, #0c0a1d 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        />

        {/* Circuit pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Holographic sheen */}
        <div
          ref={sheenRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(99,102,241,0.12) 40%, rgba(139,92,246,0.15) 45%, rgba(6,182,212,0.1) 50%, rgba(59,130,246,0.12) 55%, transparent 65%)',
            width: '100%',
            height: '100%',
            transform: 'translateX(-120%)',
          }}
        />

        {/* Scanline */}
        <div
          ref={scanlineRef}
          className="absolute inset-x-0 h-[2px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.5) 20%, rgba(139,92,246,0.6) 50%, rgba(59,130,246,0.5) 80%, transparent 100%)',
            boxShadow: '0 0 15px rgba(99,102,241,0.4)',
            transform: 'translateY(-100%)',
          }}
        />

        {/* Card content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-mono text-blue-400/70 tracking-widest uppercase">EIP-8004</div>
                <div className="text-lg font-bold text-white tracking-wide">STARK LICENSE</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-white/30 tracking-wider">NETWORK</div>
              <div className="text-xs font-mono text-blue-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block animate-pulse" />
                BASE
              </div>
            </div>
          </div>

          {/* Center - Agent ID */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="text-[10px] font-mono text-white/25 tracking-[0.3em] mb-1">AGENT IDENTITY</div>
            <div className="text-2xl font-mono font-bold text-white/90 tracking-wider license-id-glow">
              #0042
            </div>
            <div className="text-[10px] font-mono text-white/20 mt-1 tracking-widest">
              STARKBOT AGENT LICENSE
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] font-mono text-white/25 tracking-wider">OWNER</div>
              <div className="text-xs font-mono text-white/50">0x57bf...d989</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-white/25 tracking-wider">STATUS</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-green-400">ACTIVE</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-white/25 tracking-wider">FEE</div>
              <div className="text-xs font-mono text-white/50">1,000 STARK</div>
            </div>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-500/30 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500/30 rounded-br-2xl" />
      </div>
    </div>
  )
}

function StepCard({ number, icon, title, description }: {
  number: number
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-300 card-glow group">
      <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20">
        {number}
      </div>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:text-blue-300 transition-colors flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-white font-semibold mb-1">{title}</h3>
          <p className="text-white/50 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-300 card-glow">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

export default function StarkLicense() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Stars />
      <GridBackground />
      <div className="relative z-10">
        <Navbar />

        <main className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-mono mb-6">
                <Shield className="w-3 h-3" />
                EIP-8004 IDENTITY REGISTRY
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Stark License
              </h1>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                On-chain identity for AI agents. Register your agent on Base, get an NFT license, and unlock the full StarkBot ecosystem.
              </p>
            </div>

            {/* Animated License Card */}
            <div className="mb-20">
              <AnimatedLicense />
            </div>

            {/* What is StarkLicense */}
            <section className="mb-20">
              <h2 className="text-2xl font-semibold mb-2">What is a Stark License?</h2>
              <p className="text-white/50 mb-8 max-w-3xl">
                A Stark License is an ERC-721 NFT minted on Base that serves as a unique, verifiable identity for AI agents.
                Built on the EIP-8004 Identity Registry standard, each license gives your agent a permanent on-chain presence
                with metadata, a registration URI, and optional wallet delegation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard
                  icon={<Shield className="w-5 h-5" />}
                  title="On-Chain Identity"
                  description="Each agent gets a unique NFT identity on Base. Permanent, verifiable, and fully owned by you."
                />
                <FeatureCard
                  icon={<Coins className="w-5 h-5" />}
                  title="Deflationary Burn"
                  description="Registration burns 1,000 STARKBOT tokens, reducing supply and strengthening the ecosystem."
                />
                <FeatureCard
                  icon={<Wallet className="w-5 h-5" />}
                  title="Wallet Delegation"
                  description="Delegate an operational wallet to your agent via EIP-712 signatures for secure autonomous actions."
                />
              </div>
            </section>

            {/* How to Register */}
            <section className="mb-20">
              <h2 className="text-2xl font-semibold mb-2">How to Register</h2>
              <p className="text-white/50 mb-8">
                Registration is handled through your StarkBot agent using the <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-blue-400 font-mono">agent_identity</code> skill.
                Just chat with your agent and it takes care of the rest. You'll need 1,000 STARKBOT tokens on Base.
              </p>
              <div className="space-y-6">
                <StepCard
                  number={1}
                  icon={<MessageSquare className="w-5 h-5" />}
                  title="Create Your Identity"
                  description='Tell your agent to create an identity. It will generate an IDENTITY.json file with your agent name, description, and EIP-8004 metadata. You can also add service endpoints (MCP, A2A, chat, x402, swap) for discovery by other agents.'
                />
                <StepCard
                  number={2}
                  icon={<Upload className="w-5 h-5" />}
                  title="Publish to Registry"
                  description="Ask your agent to upload the identity file. It publishes to identity.defirelay.com and returns a hosted URL that will be linked to your on-chain license."
                />
                <StepCard
                  number={3}
                  icon={<Coins className="w-5 h-5" />}
                  title="Approve & Register On-Chain"
                  description="Your agent approves 1,000 STARKBOT tokens and calls the StarkLicense contract on Base. The tokens are burned, and an ERC-721 Agent License NFT is minted to your wallet."
                />
                <StepCard
                  number={4}
                  icon={<CheckCircle className="w-5 h-5" />}
                  title="You're Registered"
                  description="Your agent now has a permanent on-chain identity. You can update your URI, set metadata, and delegate an operational wallet at any time — all through your agent chat."
                />
              </div>

              {/* Chat example */}
              <div className="mt-8 p-6 bg-black/50 border border-white/10 rounded-2xl overflow-x-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-white/30 text-xs font-mono ml-2">Agent Chat</span>
                </div>
                <div className="space-y-4 text-sm font-mono">
                  {/* User message */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white/50 text-xs">you</span>
                    </div>
                    <div className="text-white/80">
                      Create my agent identity. Name it "TradeBot" with description{' '}
                      <span className="text-amber-300">"Autonomous DeFi trading agent on Base"</span>
                    </div>
                  </div>
                  {/* Agent response */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="text-white/60">
                      <span className="text-green-400">{'>'}</span> Created IDENTITY.json with EIP-8004 schema{'\n'}
                      <span className="text-green-400">{'>'}</span> x402 support enabled, status: active
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="border-t border-white/5" />
                  {/* User message */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white/50 text-xs">you</span>
                    </div>
                    <div className="text-white/80">
                      Upload it and register on-chain
                    </div>
                  </div>
                  {/* Agent response */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="text-white/60 space-y-1">
                      <div><span className="text-green-400">{'>'}</span> Uploaded to identity.defirelay.com</div>
                      <div><span className="text-green-400">{'>'}</span> Approved 1,000 STARKBOT for StarkLicense</div>
                      <div><span className="text-green-400">{'>'}</span> Registered on-chain. <span className="text-blue-400">Agent ID: #0042</span></div>
                      <div><span className="text-green-400">{'>'}</span> NFT minted to your wallet. <span className="text-green-400">You're live.</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow summary */}
              <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                <div className="flex items-start gap-3">
                  <Send className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/50 text-sm leading-relaxed">
                    <span className="text-white/70 font-medium">Full workflow:</span>{' '}
                    Create identity <span className="text-white/30 mx-1">→</span>{' '}
                    Add services <span className="text-white/30 mx-1">→</span>{' '}
                    Upload to registry <span className="text-white/30 mx-1">→</span>{' '}
                    Approve STARKBOT <span className="text-white/30 mx-1">→</span>{' '}
                    Register on-chain <span className="text-white/30 mx-1">→</span>{' '}
                    Update anytime
                  </p>
                </div>
              </div>
            </section>

            {/* What you get */}
            <section className="mb-20">
              <h2 className="text-2xl font-semibold mb-2">What You Get</h2>
              <p className="text-white/50 mb-8">
                Your Stark License is more than an NFT. It's a full agent identity with on-chain capabilities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Unique Agent ID', detail: 'Auto-incrementing ERC-721 token ID' },
                  { label: 'Agent URI', detail: 'Set and update your agent metadata URL' },
                  { label: 'Key-Value Metadata', detail: 'Store arbitrary data on-chain for your agent' },
                  { label: 'Wallet Delegation', detail: 'Delegate an operational wallet via EIP-712 signatures' },
                  { label: 'Transferable', detail: 'Standard ERC-721 — transfer, sell, or delegate your license' },
                  { label: 'Multi-Agent Support', detail: 'Register multiple agents from a single wallet' },
                ].map(({ label, detail }) => (
                  <div key={label} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-white text-sm font-medium">{label}</div>
                      <div className="text-white/40 text-xs">{detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contract Details */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold mb-2">Contract Details</h2>
              <p className="text-white/50 mb-8">
                The StarkLicense contract is deployed on Base mainnet as an upgradeable proxy (ERC-1967 UUPS).
              </p>
              <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-white/30 text-xs font-mono tracking-wider mb-1">CONTRACT (PROXY)</div>
                    <a
                      href={BASESCAN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm font-mono break-all transition-colors inline-flex items-center gap-1.5"
                    >
                      {CONTRACT_ADDRESS}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs font-mono tracking-wider mb-1">NETWORK</div>
                    <div className="text-white/70 text-sm font-mono">Base Mainnet (Chain ID: 8453)</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs font-mono tracking-wider mb-1">TOKEN STANDARD</div>
                    <div className="text-white/70 text-sm font-mono">ERC-721 (EIP-8004 Identity Registry)</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs font-mono tracking-wider mb-1">REGISTRATION FEE</div>
                    <div className="text-white/70 text-sm font-mono">1,000 STARKBOT</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs font-mono tracking-wider mb-1">TOKEN NAME</div>
                    <div className="text-white/70 text-sm font-mono">STARKBOT Agent License</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-xs font-mono tracking-wider mb-1">TOKEN SYMBOL</div>
                    <div className="text-white/70 text-sm font-mono">STARK-LICENSE</div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3">
                  <a
                    href={BASESCAN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all duration-300 border border-blue-500/20 hover:border-blue-500/40 text-sm"
                  >
                    View on Basescan
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href={`${BASESCAN_URL}#writeProxyContract`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20 text-sm"
                  >
                    Register via Basescan
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
