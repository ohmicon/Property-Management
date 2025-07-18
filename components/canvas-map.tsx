"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, RotateCcw, ImageIcon, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import  {mapCircles} from "@/data/map-circles"

interface Circle {
  x: number
  y: number
  r: number
  status: "available" | "booked" | "pending"
  id: string
}

interface CanvasMapProps {
  onCircleClick?: (circle: Circle) => void
  onImageUpload?: (imageUrl: string) => void
  onFilterChange?: (mode: "day" | "month") => void
}

export default function CanvasMap({ onCircleClick, onImageUpload, onFilterChange }: CanvasMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUploadArea, setShowUploadArea] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [filterMode, setFilterMode] = useState<"day" | "month">("month")

  // Map state
  const offsetRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const lastTouchDistRef = useRef<number | null>(null)
  const lastTouchMidRef = useRef<{ x: number; y: number } | null>(null)
  const isTouchPanningRef = useRef(false)

  // Property circles data
  const [circles, setCircles] = useState<Circle[]>([
  ])
  useEffect(() => {
    setCircles(mapCircles)
  }, [])

  // Status colors
  const statusColors = {
    available: "rgba(0, 200, 0, 0.7)",
    booked: "rgba(200, 0, 0, 0.7)",
    pending: "rgba(255, 165, 0, 0.7)",
  }

  // Initialize default background image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setBackgroundImage(img)
      setIsImageLoaded(true)
    }
    img.src = "./NumberOneNightMarketZoneA.jpg";
    //img.src = "https://picsum.photos/id/1015/1200/800"
  }, [])

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !backgroundImage) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    // Apply transformations
    ctx.translate(offsetRef.current.x, offsetRef.current.y)
    ctx.scale(scaleRef.current, scaleRef.current)

    // Draw background image
    ctx.drawImage(backgroundImage, 0, 0)

    // Draw circles
    circles.forEach((circle) => {
      ctx.beginPath()
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
      ctx.fillStyle = statusColors[circle.status] || "rgba(0,0,0,0.5)"
      ctx.fill()
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2 / scaleRef.current
      ctx.stroke()

      // Draw circle ID
      ctx.fillStyle = "white"
      ctx.font = `${12 / scaleRef.current}px Arial`
      ctx.textAlign = "center"
      ctx.fillText(circle.id, circle.x, circle.y + 4 / scaleRef.current)
    })

    ctx.restore()
  }, [backgroundImage, circles, statusColors])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    if (isImageLoaded) {
      draw()
    }
  }, [draw, isImageLoaded])

  // Handle image upload
  const handleImageUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setBackgroundImage(img)
          setIsImageLoaded(true)
          setShowUploadArea(false)
          // Reset view
          offsetRef.current = { x: 0, y: 0 }
          scaleRef.current = 1

          // Call the callback with the image URL
          if (onImageUpload && e.target?.result) {
            onImageUpload(e.target.result as string)
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    },
    [onImageUpload],
  )

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleImageUpload(file)
      }
    },
    [handleImageUpload],
  )

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const imageFile = files.find((file) => file.type.startsWith("image/"))

      if (imageFile) {
        handleImageUpload(imageFile)
      }
    },
    [handleImageUpload],
  )

  // Reset view
  const resetView = useCallback(() => {
    offsetRef.current = { x: 0, y: 0 }
    scaleRef.current = 1
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
      scaleRef.current = Math.max(0.5, Math.min(3, scaleRef.current))

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

  // Handle status change
  const handleStatusChange = useCallback(
    (circle: Circle) => {
      let newStatus: "available" | "booked" | "pending"
      if (circle.status === "available") newStatus = "booked"
      else if (circle.status === "booked") newStatus = "pending"
      else newStatus = "available"

      setCircles((prevCircles) => prevCircles.map((c) => (c.id === circle.id ? { ...c, status: newStatus } : c)))

      onCircleClick?.({ ...circle, status: newStatus })
    },
    [onCircleClick],
  )

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
          handleStatusChange(circle)
          break
        }
      }
    },
    [circles, handleStatusChange],
  )

  // Touch events
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

  // Redraw when circles change
  useEffect(() => {
    draw()
  }, [circles, draw])

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    const handleTriggerUpload = () => {
      setShowUploadArea(true)
    }

    window.addEventListener("triggerUpload", handleTriggerUpload)
    return () => window.removeEventListener("triggerUpload", handleTriggerUpload)
  }, [])

  useEffect(() => {
    onFilterChange?.(filterMode)
  }, [filterMode, onFilterChange])

  return (
    <div className="relative w-full h-full">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing border-2 border-gray-300 ${
          isDragOver ? "border-blue-500 border-dashed" : ""
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ touchAction: "none" }}
      />

      {/* Enhanced Upload Area */}
      {showUploadArea && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 p-6 bg-white">
            <CardContent className="text-center space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">อัพโหลดรูปภาพ</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadArea(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">ลากและวางรูปภาพที่นี่ หรือ</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  เลือกไฟล์
                </Button>
              </div>

              <p className="text-xs text-gray-500">รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 10MB)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Drag overlay */}
      {isDragOver && !showUploadArea && (
        <div className="absolute inset-0 bg-blue-500/20 border-4 border-blue-500 border-dashed flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Upload className="w-12 h-12 mx-auto text-blue-500 mb-2" />
            <p className="text-lg font-semibold text-blue-600">วางรูปภาพที่นี่</p>
          </div>
        </div>
      )}

      {/* Filter and Control Buttons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* Filter Options */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
            </div>

            {/* Month Checkbox */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="showMonth"
                checked={filterMode === "month"}
                onChange={(e) => setFilterMode(e.target.checked ? "month" : "day")}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="showMonth" className="text-sm text-gray-700">
                แสดงทั้งเดือน
              </label>
            </div>

            {/* Day Selection - Show when checkbox is unchecked */}
            {filterMode === "day" && (
              <div className="mt-3 p-2 bg-gray-50 rounded-md">
                <div className="text-xs text-gray-600 mb-2">เลือกวันที่:</div>
                <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      className="w-6 h-6 text-xs border border-gray-300 rounded hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center justify-center"
                      onClick={() => {
                        // Handle day selection
                        console.log(`Selected day: ${day}`)
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          {/* <Button
            onClick={() => setShowUploadArea(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
            size="default"
          >
            <Upload className="w-4 h-4 mr-2" />
            อัพโหลดรูปภาพ
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="bg-white/90 hover:bg-white shadow-lg border-blue-200 hover:border-blue-300"
            size="sm"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            เลือกไฟล์
          </Button> */}

          <Button onClick={resetView} variant="outline" className="bg-white/90 hover:bg-white shadow-lg" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            รีเซ็ตมุมมอง
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />

      {/* Loading indicator */}
      {!isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <div className="text-gray-500">กำลังโหลดแผนที่...</div>
          </div>
        </div>
      )}

      {/* Enhanced Instructions */}
      {showInstructions && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-3 rounded-lg max-w-xs backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions(false)}
            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-black/80 hover:bg-black"
          >
            <X className="w-4 h-4" />
          </Button>
          <h4 className="font-semibold mb-2 text-yellow-300">วิธีใช้งาน:</h4>
          <div className="space-y-1">
            <p>• ใช้ล้อเมาส์เพื่อซูม</p>
            <p>• ลากเพื่อเลื่อนแผนที่</p>
            <p>• คลิกวงกลมเพื่อเปลี่ยนสถานะ</p>
            <p>• ลากรูปภาพมาวางเพื่อเปลี่ยนพื้นหลัง</p>
            <p>• บนมือถือ: หยิกเพื่อซูม</p>
          </div>
        </div>
      )}
    </div>
  )
}
