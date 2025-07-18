"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"

interface Circle {
  x: number
  y: number
  r: number
  status: "available" | "booked" | "pending"
  id: string
  name: string
}

interface InteractiveMapProps {
  onCircleClick?: (circle: Circle) => void
}

export default function InteractiveMap({ onCircleClick }: InteractiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Map state
  const offsetRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const lastTouchDistRef = useRef<number | null>(null)
  const lastTouchMidRef = useRef<{ x: number; y: number } | null>(null)
  const isTouchPanningRef = useRef(false)

  // Property data with Thai property names
  const circles: Circle[] = [
    { x: 200, y: 150, r: 15, status: "available", id: "A01", name: "แปลง A-01" },
    { x: 280, y: 150, r: 15, status: "booked", id: "A02", name: "แปลง A-02" },
    { x: 360, y: 150, r: 15, status: "pending", id: "A03", name: "แปลง A-03" },
    { x: 440, y: 150, r: 15, status: "available", id: "A04", name: "แปลง A-04" },
    { x: 520, y: 150, r: 15, status: "available", id: "A05", name: "แปลง A-05" },

    { x: 200, y: 220, r: 15, status: "booked", id: "B01", name: "แปลง B-01" },
    { x: 280, y: 220, r: 15, status: "available", id: "B02", name: "แปลง B-02" },
    { x: 360, y: 220, r: 15, status: "pending", id: "B03", name: "แปลง B-03" },
    { x: 440, y: 220, r: 15, status: "booked", id: "B04", name: "แปลง B-04" },
    { x: 520, y: 220, r: 15, status: "available", id: "B05", name: "แปลง B-05" },

    { x: 200, y: 290, r: 15, status: "available", id: "C01", name: "แปลง C-01" },
    { x: 280, y: 290, r: 15, status: "pending", id: "C02", name: "แปลง C-02" },
    { x: 360, y: 290, r: 15, status: "available", id: "C03", name: "แปลง C-03" },
    { x: 440, y: 290, r: 15, status: "booked", id: "C04", name: "แปลง C-04" },
    { x: 520, y: 290, r: 15, status: "available", id: "C05", name: "แปลง C-05" },

    { x: 200, y: 360, r: 15, status: "pending", id: "D01", name: "แปลง D-01" },
    { x: 280, y: 360, r: 15, status: "available", id: "D02", name: "แปลง D-02" },
    { x: 360, y: 360, r: 15, status: "booked", id: "D03", name: "แปลง D-03" },
    { x: 440, y: 360, r: 15, status: "available", id: "D04", name: "แปลง D-04" },
    { x: 520, y: 360, r: 15, status: "pending", id: "D05", name: "แปลง D-05" },
  ]

  // Status colors matching the legend
  const statusColors = {
    available: "rgba(34, 197, 94, 0.8)", // Green
    booked: "rgba(239, 68, 68, 0.8)", // Red
    pending: "rgba(251, 191, 36, 0.8)", // Yellow
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    // Apply transformations
    ctx.translate(offsetRef.current.x, offsetRef.current.y)
    ctx.scale(scaleRef.current, scaleRef.current)

    // Draw background (site plan)
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, 800, 600)

    // Draw grid lines for site layout
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1 / scaleRef.current

    // Vertical lines
    for (let x = 100; x <= 700; x += 80) {
      ctx.beginPath()
      ctx.moveTo(x, 100)
      ctx.lineTo(x, 500)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 100; y <= 500; y += 70) {
      ctx.beginPath()
      ctx.moveTo(100, y)
      ctx.lineTo(700, y)
      ctx.stroke()
    }

    // Draw roads/paths
    ctx.fillStyle = "#94a3b8"
    ctx.fillRect(90, 90, 620, 20) // Top road
    ctx.fillRect(90, 480, 620, 20) // Bottom road
    ctx.fillRect(90, 90, 20, 410) // Left road
    ctx.fillRect(690, 90, 20, 410) // Right road

    // Draw property circles
    circles.forEach((circle) => {
      ctx.beginPath()
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
      ctx.fillStyle = statusColors[circle.status]
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2 / scaleRef.current
      ctx.stroke()

      // Draw property ID
      ctx.fillStyle = "#1f2937"
      ctx.font = `${12 / scaleRef.current}px Arial`
      ctx.textAlign = "center"
      ctx.fillText(circle.id, circle.x, circle.y + 4 / scaleRef.current)
    })

    ctx.restore()
  }, [circles, statusColors])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    setIsLoaded(true)
    draw()
  }, [draw])

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return

      const zoom = e.deltaY < 0 ? 1.1 : 0.9
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const wx = (mouseX - offsetRef.current.x) / scaleRef.current
      const wy = (mouseY - offsetRef.current.y) / scaleRef.current

      scaleRef.current *= zoom
      scaleRef.current = Math.max(0.5, Math.min(3, scaleRef.current)) // Limit zoom

      offsetRef.current.x = mouseX - wx * scaleRef.current
      offsetRef.current.y = mouseY - wy * scaleRef.current

      draw()
    },
    [draw],
  )

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return

      offsetRef.current.x += e.clientX - dragStartRef.current.x
      offsetRef.current.y += e.clientY - dragStartRef.current.y
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      draw()
    },
    [draw],
  )

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Handle click on circles
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left - offsetRef.current.x) / scaleRef.current
      const my = (e.clientY - rect.top - offsetRef.current.y) / scaleRef.current

      for (const circle of circles) {
        const dx = mx - circle.x
        const dy = my - circle.y
        if (Math.sqrt(dx * dx + dy * dy) <= circle.r) {
          onCircleClick?.(circle)
          break
        }
      }
    },
    [circles, onCircleClick],
  )

  // Touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy)

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      lastTouchMidRef.current = { x: midX, y: midY }
    } else if (e.touches.length === 1) {
      isTouchPanningRef.current = true
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()

      if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)

        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2

        const zoom = dist / lastTouchDistRef.current

        const wx = (midX - offsetRef.current.x) / scaleRef.current
        const wy = (midY - offsetRef.current.y) / scaleRef.current

        scaleRef.current *= zoom
        scaleRef.current = Math.max(0.5, Math.min(3, scaleRef.current))

        offsetRef.current.x = midX - wx * scaleRef.current
        offsetRef.current.y = midY - wy * scaleRef.current

        lastTouchDistRef.current = dist
        lastTouchMidRef.current = { x: midX, y: midY }

        draw()
      } else if (e.touches.length === 1 && isTouchPanningRef.current) {
        const x = e.touches[0].clientX
        const y = e.touches[0].clientY
        offsetRef.current.x += x - dragStartRef.current.x
        offsetRef.current.y += y - dragStartRef.current.y
        dragStartRef.current = { x, y }
        draw()
      }
    },
    [draw],
  )

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastTouchDistRef.current = null
      lastTouchMidRef.current = null
    }
    if (e.touches.length === 0) {
      isTouchPanningRef.current = false
    }
  }, [])

  // Add wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener("wheel", handleWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "none" }}
    />
  )
}
