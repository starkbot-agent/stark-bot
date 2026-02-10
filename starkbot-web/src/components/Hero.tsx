import { Github, ChevronDown, BookOpen, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 relative">
      <div className="max-w-4xl mx-auto text-center">
        {/* Mascot/Logo - flips to old logo on hover */}
        <div className="mb-8 animate-float">
          <div className="w-32 h-32 mx-auto [perspective:600px] group cursor-pointer">
            <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              {/* Front - new logo */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden glow [backface-visibility:hidden]">
                <img src="/starkbot-pfp.png" alt="StarkBot" className="w-full h-full object-cover" />
              </div>
              {/* Back - old logo */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden glow [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <img src="/starkbot.png" alt="StarkBot Classic" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Title with Heart */}
        <div className="relative inline-block">
          <h1 className="text-5xl sm:text-7xl font-black mb-6 tracking-tight text-white">
            StarkBot
          </h1>
          <Link
            to="/docs/scheduling"
            className="absolute -top-2 -right-10 sm:-right-14 group cursor-pointer"
            title="Heartbeat scheduling"
          >
            <Heart
              size={24}
              className="text-blue-500 fill-blue-500 group-hover:animate-heartbeat"
            />
          </Link>
        </div>

        {/* Tagline */}
        <p className="text-white/70 text-xl sm:text-2xl font-semibold uppercase tracking-widest mb-2">
          Web3-Native AI Agent
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm font-medium">
            Sign In With Ethereum
          </span>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm font-medium">
            x402 Payments
          </span>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm font-medium">
            DeFi Relay
          </span>
        </div>

        {/* Description */}
        <p className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
          A crypto-native AI assistant with wallet authentication, x402 micropayments, and autonomous agent capabilities.
          Open source, self-hostable, and built for the decentralized web.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/ethereumdegen/stark-bot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/25 hover:to-white/15 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-white/10 border border-white/20 flex items-center justify-center gap-3"
          >
            <Github className="w-6 h-6" />
            View on GitHub
          </a>
          <Link
            to="/docs"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40 flex items-center justify-center gap-3"
          >
            <BookOpen className="w-6 h-6" />
            Read the Docs
          </Link>
          <a
            href="#features"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30 flex items-center justify-center gap-2"
          >
            Learn More
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
