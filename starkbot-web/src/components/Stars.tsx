import { useEffect, useRef } from 'react'

export function Stars() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const numStars = 100
    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      star.style.animationDelay = `${Math.random() * 5}s`
      star.style.animationDuration = `${4 + Math.random() * 4}s`
      const size = Math.random() * 1.5 + 0.5
      star.style.width = `${size}px`
      star.style.height = `${size}px`
      star.style.opacity = `${0.2 + Math.random() * 0.3}`
      container.appendChild(star)
    }

    return () => {
      container.innerHTML = ''
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    />
  )
}
