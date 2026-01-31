import { NavLink } from 'react-router-dom'
import docsConfig from '@/config/docs-config'

export default function DocsSidenav() {
  return (
    <nav className="py-4">
      {docsConfig.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-6">
          <h3 className="px-4 text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">
            {section.title}
          </h3>
          <div className="flex flex-col">
            {section.items.map((item, itemIndex) => (
              <NavLink
                key={itemIndex}
                to={item.to}
                end={item.to === '/docs'}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-mono transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400 border-r-2 border-blue-500'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
