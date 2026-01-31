import { Github, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
          Ready to Build Web3-Native AI?
        </h2>
        <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">
          Connect your wallet, leverage x402 micropayments, and deploy your own crypto-native AI agent. Open source and permissionless.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/ethereumdegen/stark-bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
          >
            <Github className="w-6 h-6" />
            Star on GitHub
          </a>
          <Link
            to="/docs"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-blue-500/50"
          >
            <BookOpen className="w-6 h-6" />
            Read the Docs
          </Link>
        </div>
      </div>
    </section>
  )
}
