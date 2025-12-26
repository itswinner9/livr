'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface CardSpotlightProps {
  children: React.ReactNode
  className?: string
  slotClass?: string
  gradientSize?: number
  gradientColor?: string
  gradientOpacity?: number
}

export default function CardSpotlight({
  children,
  className = '',
  slotClass = '',
  gradientSize = 200,
  gradientColor = '#C9C9C9',
  gradientOpacity = 0.8,
}: CardSpotlightProps) {
  const [mouseX, setMouseX] = useState(-gradientSize * 10)
  const [mouseY, setMouseY] = useState(-gradientSize * 10)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMouseX(e.clientX - rect.left)
    setMouseY(e.clientY - rect.top)
  }

  const handleMouseLeave = () => {
    setMouseX(-gradientSize * 10)
    setMouseY(-gradientSize * 10)
  }

  const backgroundStyle = {
    background: `radial-gradient(
      circle at ${mouseX}px ${mouseY}px,
      ${gradientColor} 0%,
      rgba(0, 0, 0, 0) 70%
    )`,
    opacity: gradientOpacity,
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative flex size-full overflow-hidden rounded-xl border bg-neutral-100 text-black dark:bg-neutral-900 dark:text-white',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={cn('relative z-10', slotClass)}>
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={backgroundStyle}
      />
    </div>
  )
}

