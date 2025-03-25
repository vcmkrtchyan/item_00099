"use client"

import { useMemo } from "react"

interface BookPlaceholderProps {
  title: string
  author: string
  className?: string
}

// Function to generate a deterministic color based on the book title
// This ensures the same book always gets the same color
function generateColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Generate pastel colors for better aesthetics
  const h = Math.abs(hash) % 360
  const s = 70 + (Math.abs(hash) % 20) // 70-90% saturation
  const l = 75 + (Math.abs(hash) % 15) // 75-90% lightness

  return `hsl(${h}, ${s}%, ${l}%)`
}

export function BookPlaceholder({ title, author, className }: BookPlaceholderProps) {
  // Generate a deterministic color based on the book title
  const backgroundColor = useMemo(() => generateColorFromString(title), [title])

  // Get initials for display
  const getInitials = () => {
    const words = title.split(" ")
    if (words.length === 1) {
      return title.substring(0, 2).toUpperCase()
    }
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
  }

  const initials = useMemo(() => getInitials(), [title])

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center text-center p-2 ${className}`}
      style={{ backgroundColor }}
    >
      <div className="text-2xl font-bold text-white drop-shadow-md mb-1">{initials}</div>
      <div className="text-xs font-medium text-white drop-shadow-md line-clamp-2 max-w-full">{title}</div>
      <div className="text-[10px] text-white/80 drop-shadow-md mt-0.5 line-clamp-1 max-w-full">by {author}</div>
    </div>
  )
}

