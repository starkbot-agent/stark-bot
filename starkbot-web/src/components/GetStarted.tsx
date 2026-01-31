import { Cloud } from 'lucide-react'

const steps = [
  {
    number: 1,
    title: 'Clone the Repo',
    description: 'Get the source code from GitHub',
  },
  {
    number: 2,
    title: 'Configure',
    description: 'Set up your env vars and x402 facilitator',
  },
  {
    number: 3,
    title: 'Run with Docker',
    description: 'Deploy and connect your wallet',
  },
]

export function GetStarted() {
  return (
    <section className="py-20 px-6 bg-white/[0.02]">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
          Get Started in Minutes
        </h2>
        <p className="text-white/50 mb-16 max-w-2xl mx-auto">
          Self-host your Web3-native AI with Docker or deploy to the cloud
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step) => (
            <div key={step.number}>
              <div className="w-12 h-12 border-2 border-white/20 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 text-white">
                {step.number}
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
              <p className="text-white/50">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Docker Code Block */}
        <div className="bg-black/50 rounded-xl border border-white/10 p-6 text-left max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-white/20 rounded-full" />
            <div className="w-3 h-3 bg-white/20 rounded-full" />
            <div className="w-3 h-3 bg-white/20 rounded-full" />
            <span className="ml-2 text-white/30 text-sm">terminal</span>
          </div>
          <code className="text-sm text-white font-mono block space-y-1">
            <div><span className="text-white/40">$</span> git clone https://github.com/ethereumdegen/stark-bot</div>
            <div><span className="text-white/40">$</span> cd stark-bot</div>
            <div><span className="text-white/40">$</span> cp .env.example .env</div>
            <div><span className="text-white/40">$</span> docker compose up -d</div>
          </code>
        </div>

        {/* DigitalOcean Section */}
        <div className="mt-20">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
            Deploy to the Cloud
          </h3>
          <p className="text-white/50 mb-8 max-w-2xl mx-auto">
            Deploy StarkBot directly to DigitalOcean App Platform for a fully managed, serverless experience
          </p>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Cloud className="w-8 h-8 text-white/70" />
              <span className="text-xl font-bold text-white">DigitalOcean App Platform</span>
            </div>

            <ol className="text-left text-white/60 space-y-4 mb-8">
              <li className="flex gap-3">
                <span className="text-white/40 font-bold">1.</span>
                <span>Fork the <a href="https://github.com/ethereumdegen/stark-bot" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 underline">stark-bot repository</a> to your GitHub account</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white/40 font-bold">2.</span>
                <span>Go to <a href="https://cloud.digitalocean.com/apps" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 underline">DigitalOcean App Platform</a> and click "Create App"</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white/40 font-bold">3.</span>
                <span>Connect your GitHub and select the forked repository</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white/40 font-bold">4.</span>
                <span>Configure environment variables (API keys, DeFi Relay x402 facilitator)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white/40 font-bold">5.</span>
                <span>Deploy! DigitalOcean auto-detects the Dockerfile</span>
              </li>
            </ol>

            <a
              href="https://cloud.digitalocean.com/apps/new?repo=https://github.com/ethereumdegen/stark-bot/tree/main"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0080FF] hover:bg-[#0069d9] text-white font-semibold rounded-lg transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 0C5.408-.02.005 5.37.005 11.992h4.638c0-4.923 4.882-8.731 10.064-6.9a6.81 6.81 0 014.16 4.16c1.83 5.182-1.977 10.064-6.9 10.064v-3.601l-4.927 4.926 4.927 4.928v-3.607c6.618-.007 11.993-5.418 11.967-12.042C23.907 5.376 18.562.02 12.04 0z"/>
              </svg>
              Deploy to DigitalOcean
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
