import { useEffect, useRef, useState } from 'react'

export function GridBackground() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to 0-1 range
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      setMousePos({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Calculate subtle offset based on mouse position
  const offsetX = (mousePos.x - 0.5) * 30
  const offsetY = (mousePos.y - 0.5) * 20

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 top-0 h-[800px] pointer-events-none overflow-hidden z-0"
    >
      {/* Animated grid pattern */}
      <div className="absolute inset-0 grid-bg opacity-50" />

      {/* Animated flowing lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-60"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{
          transform: `translate(${offsetX * 0.3}px, ${offsetY * 0.3}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <defs>
          {/* Gradient for the flowing lines - more subtle */}
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.35)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.25)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </linearGradient>
          <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.2)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
          </linearGradient>

          {/* Subtle glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Flowing curve 1 */}
        <path
          d="M-100,200 Q200,80 500,200 T1100,200 T1700,200 T2300,200"
          fill="none"
          stroke="url(#lineGradient1)"
          strokeWidth="1.5"
          filter="url(#glow)"
          className="animate-flow-1"
          style={{
            transform: `translateY(${offsetY * 0.5}px)`,
            transition: 'transform 0.4s ease-out',
          }}
        />

        {/* Flowing curve 2 */}
        <path
          d="M-100,350 Q300,220 600,350 T1200,350 T1800,350 T2400,350"
          fill="none"
          stroke="url(#lineGradient2)"
          strokeWidth="1"
          filter="url(#glow)"
          className="animate-flow-2"
          style={{
            transform: `translateY(${offsetY * 0.8}px)`,
            transition: 'transform 0.5s ease-out',
          }}
        />

        {/* Flowing curve 3 */}
        <path
          d="M-100,500 Q400,380 700,500 T1300,500 T1900,500 T2500,500"
          fill="none"
          stroke="url(#lineGradient3)"
          strokeWidth="0.75"
          filter="url(#glow)"
          className="animate-flow-3"
          style={{
            transform: `translateY(${offsetY * 1.1}px)`,
            transition: 'transform 0.6s ease-out',
          }}
        />
      </svg>

      {/* Floating orbs - also react to mouse */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-orb-1"
        style={{
          transform: `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)`,
          transition: 'transform 0.5s ease-out',
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-[80px] animate-orb-2"
        style={{
          transform: `translate(${offsetX * -0.3}px, ${offsetY * 0.4}px)`,
          transition: 'transform 0.6s ease-out',
        }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-[60px] animate-orb-3"
        style={{
          transform: `translate(${offsetX * 0.4}px, ${offsetY * -0.3}px)`,
          transition: 'transform 0.7s ease-out',
        }}
      />

      {/* Radial gradient fade at edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center top, transparent 0%, #1a1a1a 60%)',
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-48"
        style={{
          background: 'linear-gradient(to top, #1a1a1a 0%, transparent 100%)',
        }}
      />
    </div>
  )
}
