import { type ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Search, Moon } from 'lucide-react'
import DocsSidenav from './DocsSidenav'
import docsConfig from '@/config/docs-config'

interface Props {
  attributes: Record<string, unknown>
  children: ReactNode
}

interface TocItem {
  id: string
  text: string
  level: number
}

export default function DocsWrapper({ attributes, children }: Props) {
  const location = useLocation()
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // Find the current section for breadcrumb
  const currentSection = docsConfig.sections.find(section =>
    section.items.some(item => item.to === location.pathname)
  )

  // Extract table of contents from rendered content
  useEffect(() => {
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('.markdown-body h2, .markdown-body h3')
      const items: TocItem[] = Array.from(headings).map((heading, index) => {
        const id = heading.id || `heading-${index}`
        if (!heading.id) {
          heading.id = id
        }
        return {
          id,
          text: heading.textContent || '',
          level: heading.tagName === 'H2' ? 2 : 3,
        }
      })
      setToc(items)
    }, 100)

    return () => clearTimeout(timer)
  }, [location.pathname, children])

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    const headings = document.querySelectorAll('.markdown-body h2, .markdown-body h3')
    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [toc])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Top nav */}
      <header className="border-b border-white/10 bg-[#1a1a1a]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white text-sm font-bold">S</span>
            </div>
          </NavLink>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-auto px-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-16 py-2 text-sm text-white/80 placeholder-white/40 focus:outline-none focus:border-white/20"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-white/40 bg-white/5 rounded border border-white/10">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-white/50 hover:text-white transition-colors">
              <Moon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 border-r border-white/10 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto hidden lg:block bg-[#1a1a1a]">
          <DocsSidenav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-8 py-10">
            {/* Breadcrumb */}
            {currentSection && (
              <div className="text-sm text-blue-400 font-medium mb-2">
                {currentSection.title}
              </div>
            )}

            {/* Page Title */}
            {typeof attributes.name === 'string' && (
              <h1 className="text-4xl font-bold text-white mb-6">
                {attributes.name}
              </h1>
            )}

            {/* Content */}
            <div className="markdown-body">
              {children}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Table of Contents */}
        <aside className="w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto hidden xl:block">
          {toc.length > 0 && (
            <div className="py-8 px-4">
              <h4 className="text-sm font-semibold text-white/50 mb-4 flex items-center gap-2">
                <span className="text-white/30">=</span>
                On this page
              </h4>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={`block w-full text-left text-sm py-1 transition-colors ${
                      item.level === 3 ? 'pl-4' : ''
                    } ${
                      activeId === item.id
                        ? 'text-blue-400'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
