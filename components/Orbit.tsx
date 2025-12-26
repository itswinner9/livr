import React from 'react'
import { cn } from '@/lib/utils'

export enum ORBIT_DIRECTION {
  Clockwise = 'normal',
  CounterClockwise = 'reverse'
}

interface OrbitProps {
  children: React.ReactNode
  className?: string
  duration?: number
  delay?: number
  radius?: number
  direction?: ORBIT_DIRECTION
  path?: boolean
}

export default function Orbit({ 
  children, 
  className,
  duration = 20,
  delay = 10,
  radius = 50,
  direction = ORBIT_DIRECTION.Clockwise,
  path = false 
}: OrbitProps) {
  return (
    <>
      {path && (
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          style={{ zIndex: 0 }}
        >
          <circle
            className="stroke-gray-300/30 stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      <div
        className={cn('absolute flex size-full transform-gpu', className)}
        style={{
          animation: `orbit ${duration}s linear infinite ${delay > 0 ? '-' : ''}${Math.abs(delay)}s ${direction}`,
          '--radius': `${radius}px`,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </>
  )
}
