import { Github, Monitor } from 'lucide-react'

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-slate-800">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-stark-400 to-stark-600 rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold">StarkBot</span>
        </div>
        <p className="text-slate-500 text-sm">
          made with &lt;3 by{' '}
          <a
            href="https://ethereumdegen.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stark-400 hover:text-stark-300 transition-colors"
          >
            @ethereumdegen
          </a>
        </p>
        <a
          href="https://github.com/ethereumdegen/stark-bot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white transition-colors"
        >
          <Github className="w-6 h-6" />
        </a>
      </div>
    </footer>
  )
}
