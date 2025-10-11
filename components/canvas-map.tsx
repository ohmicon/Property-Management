"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, RotateCcw, ImageIcon, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getCircles, updateCircleStatus } from "@/lib/api/circles"
import { getOrCreateUsername, getCurrentUsername, setCurrentUsernameStorage } from "@/lib/user-utils"
import { toast } from "sonner"
import { useRealtimeBooking } from "@/hooks/use-realtime-booking"
import { getUnitMatrixApi } from "@/lib/api/unit-matrix"
import { cn } from "@/lib/utils"
import { useCustomerStore } from "@/app/customer-store"
import { useUserStore } from "@/app/user-store"

export interface Circle {
  x: number
  y: number
  r: number
  status: "available" | "booked" | "pending" | "some available",
  initStatus: "available" | "booked" | "pending" | "some available", // สถานะเริ่มต้นจาก API
  id: string
  name: string;
  room_type?: string // เพิ่ม
  bookedBy?: string // Username ของคนที่จอง (สำหรับ pending)
  bookedAt?: number // Timestamp ของการจอง
  m_price: number // ราคาเช่ารายเดือน
  d_price: number // ราคาเช่ารายวัน
}

export interface Customer {
  id: string
  name: string
  room_type: string
  phone?: string
  email?: string
}

export interface SearchUnitMatrix {
  year: number;
  month: number;
  day: number;
  counter?: number;
}

interface CanvasMapProps {
  onCircleClick?: (circle: Circle) => void
  backgroundImageUrl?: string | null
  onImageUpload?: (file: File) => void
  onFilterChange?: (mode: "day" | "month") => void
  selectedPropertyIds?: Set<string>
  onExternalCircleUpdate?: React.MutableRefObject<((circles: Circle[]) => void) | null> // ใช้ ref สำหรับ external update
  onCirclesChange?: (circles: Circle[]) => void // ส่ง circles กลับไปยัง parent
  filterUnitMatrix?: SearchUnitMatrix
  onLoading?: (isLoading: boolean) => void
  onChangeFilterDay?: (day: number) => void,
  focus: {x: number | null, y: number | null}
  selectedRoomType?: string | null // "Suite" | "Standard" | "Deluxe" | null
  customers?: Customer[] // รายชื่อลูกค้า
  selectedCustomer?: Customer | null // ลูกค้าที่เลือก
  onCustomerSelect?: (customer: Customer | null) => void // callback เมื่อเลือกลูกค้า
  businessType?: "hotel" | "market" // 🆕 เพิ่ม prop นี้
}

export const ROOM_TYPE_COLORS = {
  Suite: {
    primary: "#ec4899", // pink-500
    secondary: "#db2777",
    glow: "rgba(236, 72, 153, 0.6)",
  },
  Standard: {
    primary: "#8b5cf6", // violet-500
    secondary: "#7c3aed",
    glow: "rgba(139, 92, 246, 0.6)",
  },
  Deluxe: {
    primary: "#f59e0b", // amber-500
    secondary: "#d97706",
    glow: "rgba(245, 158, 11, 0.6)",
  },
} as const

export default function CanvasMap({ 
  onCircleClick,
  backgroundImageUrl,
  onImageUpload, 
  onFilterChange, 
  selectedPropertyIds, 
  onExternalCircleUpdate, 
  onCirclesChange, 
  filterUnitMatrix,
  onLoading,
  onChangeFilterDay,
  focus,
  selectedRoomType,
  customers,
  selectedCustomer,
  onCustomerSelect,
  businessType = "market",
}: CanvasMapProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUploadArea, setShowUploadArea] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [filterMode, setFilterMode] = useState<"day" | "month">("month")
  const [filterDay, setFilterDay] = useState<number | null>(null) // วันที่เลือก (สำหรับโหมด day)
  
  const customer = useCustomerStore((state) => state.customer); 
  const { user: userLogin } = useUserStore();
  // Real-time booking hook
  const { socket, isConnected, isLoading, broadcastCircleUpdate } = useRealtimeBooking()
  
  // Track active bookings count
  const [activeBookingsCount, setActiveBookingsCount] = useState(0)

  // Map state
  const offsetRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastTouchDistRef = useRef<number | null>(null)
  const lastTouchMidRef = useRef<{ x: number; y: number } | null>(null)
  const isTouchPanningRef = useRef(false)

  // Property circles data
  const [circles, setCircles] = useState<Circle[]>([])
  const [isLoadingCircles, setIsLoadingCircles] = useState(true)
  const [hasReceivedSocketData, setHasReceivedSocketData] = useState(false)
  const [flashPhase, setFlashPhase] = useState(0)

  // User info
  const [currentUsername, setCurrentUsername] = useState<string>('')
// ใช้ zustand อ่านข้อมูลลูกค้า
  
  // Status colors - different styles for own vs others' bookings
  const getCircleStyle = useCallback(
    (circle: Circle) => {
      const isSelectedInList = selectedPropertyIds?.has(circle.id) || false

      // 🏨 Hotel Mode - รองรับ room type highlighting
      if (businessType === "hotel") {
        const isMatchingRoomType = selectedRoomType ? circle.room_type === selectedRoomType : false
        const hasRoomTypeFilter = selectedRoomType !== null && selectedRoomType !== undefined

        const roomColor =
          circle.room_type && ROOM_TYPE_COLORS[circle.room_type as keyof typeof ROOM_TYPE_COLORS]
            ? ROOM_TYPE_COLORS[circle.room_type as keyof typeof ROOM_TYPE_COLORS]
            : { primary: "#8b5cf6", secondary: "#7c3aed", glow: "rgba(139, 92, 246, 0.6)" }

        // ห้องที่ไม่ตรงกับ filter → จาง
        if (hasRoomTypeFilter && !isMatchingRoomType) {
          return {
            fillColor: "rgba(156, 163, 175, 0.3)",
            strokeColor: "rgba(107, 114, 128, 0.4)",
            outerStrokeColor: "rgba(156, 163, 175, 0.3)",
            strokeWidth: 2,
            outerStrokeWidth: 0,
            cursor: "not-allowed",
            isDimmed: true,
            textColor: "rgba(255, 255, 255, 0.5)",
          }
        }

        // ห้องที่ตรงกับ filter และว่าง → Highlight!
        if (hasRoomTypeFilter && isMatchingRoomType && circle.status === "available") {
          return {
            fillColor: "#10b981",
            strokeColor: "#ffffff",
            outerStrokeColor: roomColor.primary,
            strokeWidth: 3,
            outerStrokeWidth: 6,
            cursor: "pointer",
            isHighlighted: true,
            shouldFlash: true,
            textColor: "white",
            glowColor: roomColor.glow,
          }
        }

        // Status colors สำหรับ Hotel
        if (circle.status === "available" && circle.initStatus === "available") {
          if (isSelectedInList) {
            return {
              fillColor: "rgba(59, 130, 246, 0.8)",
              strokeColor: "#ffffff",
              outerStrokeColor: roomColor.primary,
              strokeWidth: 3,
              outerStrokeWidth: 5,
              cursor: "pointer",
              isSelected: true,
              textColor: "white",
            }
          } else {
            return {
              fillColor: "rgba(0, 200, 0, 0.7)",
              strokeColor: "#ffffff",
              outerStrokeColor: roomColor.primary,
              strokeWidth: 2,
              outerStrokeWidth: 4,
              cursor: "pointer",
              textColor: "white",
            }
          }
        } else if (circle.status === "pending") {
          const isOwnBooking = circle.bookedBy === currentUsername
          if (isOwnBooking) {
            return {
              fillColor: "rgba(255, 165, 0, 0.8)",
              strokeColor: "#ffffff",
              outerStrokeColor: roomColor.primary,
              strokeWidth: 4,
              outerStrokeWidth: 5,
              cursor: "pointer",
              textColor: "white",
            }
          } else {
            return {
              fillColor: "rgba(200, 100, 0, 0.6)",
              strokeColor: "#ffffff",
              outerStrokeColor: roomColor.primary,
              strokeWidth: 2,
              outerStrokeWidth: 4,
              cursor: "not-allowed",
              isDashed: true,
              textColor: "rgba(255, 255, 255, 0.8)",
            }
          }
        } else if (circle.status === "some available" || circle.initStatus === "some available") {
          return {
            fillColor: "rgba(200, 200, 0, 0.7)",
            strokeColor: "#ffffff",
            outerStrokeColor: roomColor.primary,
            strokeWidth: 2,
            outerStrokeWidth: 4,
            cursor: "default",
            textColor: "white",
          }
        } else {
          return {
            fillColor: "rgba(200, 0, 0, 0.7)",
            strokeColor: "#ffffff",
            outerStrokeColor: roomColor.primary,
            strokeWidth: 2,
            outerStrokeWidth: 4,
            cursor: "default",
            textColor: "white",
          }
        }
      }

      // 🏪 Market Mode - แบบเดิม (ไม่มี room type)
      if (circle.status === "available" && circle.initStatus === "available") {
        if (isSelectedInList) {
          return {
            fillColor: "rgba(59, 130, 246, 0.8)",
            strokeColor: "rgba(37, 99, 235, 1)",
            strokeWidth: 3,
            cursor: "pointer",
            isSelected: true,
            textColor: "white",
          }
        } else {
          return {
            fillColor: "rgba(0, 200, 0, 0.7)",
            strokeColor: "rgba(0, 150, 0, 1)",
            strokeWidth: 2,
            cursor: "pointer",
            textColor: "white",
          }
        }
      } else if (circle.status === "pending") {
        const isOwnBooking = circle.bookedBy === currentUsername
        if (isOwnBooking) {
          return {
            fillColor: "rgba(255, 165, 0, 0.8)",
            strokeColor: "rgba(255, 140, 0, 1)",
            strokeWidth: 4,
            cursor: "pointer",
            textColor: "white",
          }
        } else {
          return {
            fillColor: "rgba(200, 100, 0, 0.6)",
            strokeColor: "rgba(150, 80, 0, 1)",
            strokeWidth: 2,
            cursor: "not-allowed",
            isDashed: true,
            textColor: "rgba(255, 255, 255, 0.8)",
          }
        }
      } else if (circle.status === "some available" || circle.initStatus === "some available") {
        return {
          fillColor: "rgba(200, 200, 0, 0.7)",
          strokeColor: "rgba(200, 160, 0, 1)",
          strokeWidth: 2,
          cursor: "default",
          textColor: "white",
        }
      } else {
        return {
          fillColor: "rgba(200, 0, 0, 0.7)",
          strokeColor: "rgba(150, 0, 0, 1)",
          strokeWidth: 2,
          cursor: "default",
          textColor: "white",
        }
      }
    },
    [selectedPropertyIds, selectedRoomType, currentUsername, businessType],
  )

  // Initialize username and load circles
  useEffect(() => {
    // ตั้งค่า user เข้า local storage
    if (userLogin && userLogin.username) {
      setCurrentUsernameStorage(userLogin.username)
    }
    const username = userLogin?.username || getOrCreateUsername()
    setCurrentUsername(username)

    const loadCircles = async () => {
      try {
        setIsLoadingCircles(true)
        if (onLoading) {
          onLoading(true)
        }

        const searchUnitMatrixPayload = {
          project_id: "M004",
          year: filterUnitMatrix?.year || 2025,
          month: filterUnitMatrix?.month || 9,
          day: filterUnitMatrix?.day || filterDay || 0,
        }
        const unitMatrixData = await getUnitMatrixApi(searchUnitMatrixPayload)

        let circlesData =
          unitMatrixData.data?.map((item: any) => {
            // 🏨 Hotel: กำหนด room_type (ควรมาจาก API)
            let roomType = undefined
            if (businessType === "hotel") {
              const roomTypes: ("Suite" | "Standard" | "Deluxe")[] = ["Suite", "Standard", "Deluxe"]
              roomType = item.room_type || roomTypes[Math.floor(Math.random() * roomTypes.length)]
            }

            return {
              id: item.unit_id,
              r: 23,
              status: item.status_desc.toLowerCase(),
              initStatus: item.status_desc.toLowerCase(),
              x: item.x,
              y: item.y,
              name: item.unit_number,
              room_type: roomType, // Hotel มี, Market ไม่มี
              m_price: item.m_price,
              d_price: item.d_price,
            } as Circle
          }) || []

        circlesData = circlesData.filter((item: Circle) => {
          return !(!item.x || item.x === 0) && !(!item.y || item.y === 0)
        })

        if (socket && socket.connected) {
          console.log("📡 Requesting current booking state from server...")
          socket.emit("requestCurrentState")
        }

        setCircles((prevCircles) => {
          const mergedCircles = circlesData.map((dbCircle: Circle) => {
            if (dbCircle.status === "booked" || dbCircle.status === "some available") {
              return dbCircle
            }

            const existingCircle = prevCircles.find((c) => c.id === dbCircle.id)
            if (existingCircle && existingCircle.status === "pending") {
              return existingCircle
            }

            return {
              ...dbCircle,
              status: "available" as const,
              bookedBy: undefined,
              bookedAt: undefined,
            }
          })

          const bookedCount = mergedCircles.filter((c) => c.status === "booked").length
          const pendingCount = mergedCircles.filter((c) => c.status === "pending").length

          console.log(
            `✅ [${businessType.toUpperCase()}] Loaded ${mergedCircles.length} total, ${bookedCount} booked, ${pendingCount} pending`,
          )

          setActiveBookingsCount(pendingCount)
          return mergedCircles
        })
      } catch (error) {
        console.error("❌ Failed to load circles:", error)
        toast.error("ไม่สามารถโหลดข้อมูลจุดจองได้")
      } finally {
        setIsLoadingCircles(false)
        if (onLoading) {
          onLoading(false)
        }
      }
    }

    if (hasReceivedSocketData) {
      loadCircles()
    }
  }, [hasReceivedSocketData, filterUnitMatrix, filterDay, businessType, userLogin])

  // Listen for real-time circle updates from other clients
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleCircleUpdate = (updatedCircle: Circle) => {
      console.log("📡 Received real-time circle update:", updatedCircle)

      setCircles((prevCircles) => {
        const newCircles = prevCircles.map((circle) => (circle.id === updatedCircle.id ? updatedCircle : circle))
        const newActiveCount = newCircles.filter((c) => c.status === "pending").length
        setActiveBookingsCount(newActiveCount)
        return newCircles
      })

      const statusText =
        updatedCircle.status === "available"
          ? "ว่าง"
          : updatedCircle.status === "pending"
            ? `ถูกจองโดย ${updatedCircle.bookedBy}`
            : "ขายแล้ว"
      toast.info(`🔄 ${updatedCircle.name} เปลี่ยนเป็น ${statusText}`)
    }

    socket.on("circleUpdated", handleCircleUpdate)
    console.log("🔌 Listening for real-time circle updates...")

    return () => {
      socket.off("circleUpdated", handleCircleUpdate)
      console.log("📋 Stopped listening for circle updates")
    }
  }, [socket, isConnected])

  // Listen for temporary bookings state from server (for new clients)
  useEffect(() => {
    const handleTemporaryBookingsReceived = (event: CustomEvent) => {
      const bookings = event.detail as Array<{ circleId: string; bookedBy: string; bookedAt: number }>
      console.log("📦 Processing current booking state from server:", bookings)

      setHasReceivedSocketData(true)

      if (bookings.length > 0) {
        let updatedCount = 0
        setCircles((prevCircles) => {
          const newCircles = prevCircles.map((circle) => {
            if (circle.status === "booked") {
              return circle
            }

            const booking = bookings.find((b) => b.circleId === circle.id)
            if (booking) {
              updatedCount++
              return {
                ...circle,
                status: "pending" as const,
                bookedBy: booking.bookedBy,
                bookedAt: booking.bookedAt,
              }
            }

            if (circle.status === "pending") {
              return {
                ...circle,
                status: "available" as const,
                bookedBy: undefined,
                bookedAt: undefined,
              }
            }
            return circle
          })

          if (onCirclesChange) {
            setTimeout(() => onCirclesChange(newCircles), 0)
          }

          return newCircles
        })
        setActiveBookingsCount(updatedCount)
        toast.success(`📍 โหลดสถานะการจองปัจจุบันแล้ว (${updatedCount} จุดถูกจอง)`)
      } else {
        setCircles((prevCircles) => {
          const newCircles = prevCircles.map((circle) => {
            if (circle.status === "booked") {
              return circle
            }

            if (circle.status === "pending") {
              return {
                ...circle,
                status: "available" as const,
                bookedBy: undefined,
                bookedAt: undefined,
              }
            }
            return circle
          })

          if (onCirclesChange) {
            setTimeout(() => onCirclesChange(newCircles), 0)
          }

          return newCircles
        })
        setActiveBookingsCount(0)
        toast.info("✨ ไม่มีการจองในขณะนี้")
      }
    }

    window.addEventListener("temporaryBookingsReceived", handleTemporaryBookingsReceived as EventListener)

    return () => {
      window.removeEventListener("temporaryBookingsReceived", handleTemporaryBookingsReceived as EventListener)
    }
  }, [])

  // Listen for bookings released when clients disconnect
   useEffect(() => {
    const handleBookingsReleased = (event: CustomEvent) => {
      const releasedCircles = event.detail as Array<{ id: string; status: string; bookedBy?: string; bookedAt?: number }>
      console.log("🔓 Processing released bookings:", releasedCircles)

      if (releasedCircles.length > 0) {
        setCircles((prevCircles) => {
          const newCircles = prevCircles.map((circle) => {
            if (circle.status === "booked") {
              return circle
            }

            const releasedCircle = releasedCircles.find((r) => r.id === circle.id)
            if (releasedCircle) {
              return {
                ...circle,
                status: "available" as const,
                bookedBy: undefined,
                bookedAt: undefined,
              }
            }
            return circle
          })

          const newActiveCount = newCircles.filter((c) => c.status === "pending").length
          setActiveBookingsCount(newActiveCount)

          if (onCirclesChange) {
            setTimeout(() => onCirclesChange(newCircles), 0)
          }

          return newCircles
        })
        toast.success(`🔓 ปล่อยห้องจากการ disconnect (${releasedCircles.length} รายการ)`)
      }
    }

    window.addEventListener("bookingsReleased", handleBookingsReleased as EventListener)

    return () => {
      window.removeEventListener("bookingsReleased", handleBookingsReleased as EventListener)
    }
  }, [])
  
  // Handle external circle updates (e.g., from Property List removal)
  useEffect(() => {
    if (onExternalCircleUpdate) {
      const handleExternalUpdate = (updatedCircles: Array<Circle>) => {
        console.log('🔄 Processing external circles update:', updatedCircles)
        
        // Validate the updated circles
        if (!updatedCircles || updatedCircles.length === 0) {
          console.error('❌ Invalid external circles update:', updatedCircles)
          return
        }
        
        setCircles(prevCircles => {
          const newCircles = prevCircles.map(circle => {
            const updatedCircle = updatedCircles.find(c => c.id === circle.id)
            if (updatedCircle) {
              // Don't allow external updates to modify circles that are already booked from API
              // This is authoritative and should never be overridden
              if (circle.status === 'booked') {
                console.log(`🔒 Ignoring update for booked circle ${circle.id} (API authoritative)`);
                toast.info(`${circle.name} ถูกจองแล้ว ไม่สามารถเปลี่ยนแปลงได้`);
                return circle;
              }
              
              console.log(`🔄 Updating circle ${circle.id} status: ${circle.status} -> ${updatedCircle.status}`);
              const updatedCircleWithPosition = {
                ...circle, // รักษาตำแหน่งจริง
                status: updatedCircle.status,
                bookedBy: updatedCircle.bookedBy,
                bookedAt: updatedCircle.bookedAt
              }
              
              // Broadcast ข้อมูลที่มีตำแหน่งจริงไปยัง clients อื่น
              broadcastCircleUpdate(updatedCircleWithPosition)
              
              return updatedCircleWithPosition
            }
            return circle
          })
          
          // Update active bookings count
          const newActiveCount = newCircles.filter(c => c.status === 'pending').length
          setActiveBookingsCount(newActiveCount)
          
          return newCircles
        })
      }
      // Assign the handler to the ref
      onExternalCircleUpdate.current = handleExternalUpdate
    }
  }, [onExternalCircleUpdate, broadcastCircleUpdate, toast])

  // Send circles back to parent when they change
  useEffect(() => {
    if (onCirclesChange) {
      onCirclesChange(circles)
    }
  }, [circles, onCirclesChange])

  // Initialize default background image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setBackgroundImage(img)
      setIsImageLoaded(true)
    }
    if (backgroundImageUrl){
      img.src = backgroundImageUrl
    }
    else{
      img.src = "./Image-not-found.png";
    }
    //img.src = "https://picsum.photos/id/1015/1200/800"
  }, [backgroundImageUrl])

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !backgroundImage) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    ctx.translate(offsetRef.current.x, offsetRef.current.y)
    ctx.scale(scaleRef.current, scaleRef.current)

    ctx.drawImage(backgroundImage, 0, 0)

    circles.forEach((circle) => {
      const style = getCircleStyle(circle)

      // วาด outer stroke (สำหรับ Hotel mode เท่านั้น)
      if (businessType === "hotel" && style.outerStrokeWidth && style.outerStrokeWidth > 0) {
        if (style.shouldFlash) {
          const flashIntensity = Math.sin(flashPhase) * 0.5 + 0.5
          const pulseSize = 10 + flashIntensity * 8

          ctx.beginPath()
          ctx.arc(circle.x, circle.y, circle.r + pulseSize, 0, Math.PI * 2)
          ctx.strokeStyle = style.outerStrokeColor || "#8b5cf6"
          ctx.lineWidth = ((style.outerStrokeWidth || 0) + flashIntensity * 3) / scaleRef.current
          ctx.stroke()

          if (style.glowColor) {
            ctx.shadowColor = style.glowColor
            ctx.shadowBlur = (20 + flashIntensity * 15) / scaleRef.current
          }
        } else {
          ctx.shadowBlur = 0
          ctx.beginPath()
          ctx.arc(circle.x, circle.y, circle.r + 8, 0, Math.PI * 2)
          ctx.strokeStyle = style.outerStrokeColor || "#8b5cf6"
          ctx.lineWidth = (style.outerStrokeWidth || 4) / scaleRef.current
          ctx.stroke()
        }
      }

      ctx.shadowBlur = 0

      // วาดวงกลมหลัก
      ctx.beginPath()
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
      ctx.fillStyle = style.fillColor
      ctx.fill()

      // วาด border
      ctx.strokeStyle = style.strokeColor || "#ffffff"
      ctx.lineWidth = (style.strokeWidth || 2) / scaleRef.current

      if (style.isDashed) {
        ctx.setLineDash([5 / scaleRef.current, 3 / scaleRef.current])
      } else {
        ctx.setLineDash([])
      }

      ctx.stroke()
      ctx.setLineDash([])

      // วาดเลขห้อง/ยูนิต
      ctx.fillStyle = style.textColor || "white"
      ctx.font = `bold ${14 / scaleRef.current}px Arial`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(circle.name, circle.x, circle.y)

      // แสดง room type (Hotel mode เท่านั้น)
      if (businessType === "hotel" && style.isHighlighted && circle.room_type) {
        ctx.fillStyle = style.outerStrokeColor || "#1e40af"
        ctx.font = `bold ${10 / scaleRef.current}px Arial`
        ctx.fillText(circle.room_type, circle.x, circle.y + circle.r + 15 / scaleRef.current)
      }

      // แสดง username สำหรับ pending
      if (circle.status === "pending" && circle.bookedBy) {
        const isOwnBooking = circle.bookedBy === currentUsername
        ctx.fillStyle = isOwnBooking ? "#473f3e" : "#786665"
        ctx.font = `${9 / scaleRef.current}px Arial`
        const yOffset = businessType === "hotel" && style.isHighlighted ? 30 : 20
        ctx.fillText(circle.bookedBy, circle.x, circle.y + yOffset / scaleRef.current)

        if (isOwnBooking) {
          ctx.fillStyle = "#473f3e"
          ctx.font = `${7 / scaleRef.current}px Arial`
          ctx.fillText("(คุณ)", circle.x, circle.y + (yOffset + 10) / scaleRef.current)
        }
      }
    })

    ctx.restore()
  }, [backgroundImage, circles, getCircleStyle, flashPhase, currentUsername, businessType])

   useEffect(() => {
    let animationId: number

    const animate = () => {
      setFlashPhase((prev) => prev + 0.15)
      draw()
      animationId = requestAnimationFrame(animate)
    }

    if (businessType === "hotel" && selectedRoomType) {
      animationId = requestAnimationFrame(animate)
    } else {
      draw()
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [businessType, selectedRoomType, draw])


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

  const handleCanvasFocus = useCallback(() => {
    console.log(offsetRef.current)
    const canvas = canvasRef.current
    if (focus.x && focus.y && canvas){
      const W = canvas.width;
      const H = canvas.height;
      const targetX = focus.x;
      const targetY = focus.y;
      let offsetX = W / 2 - targetX * scaleRef.current;
      let offsetY = H / 2 - targetY * scaleRef.current;
      offsetRef.current = {x: offsetX, y: offsetY}
      draw()
    }
    else{
      resetView()
    }
  }, [draw, focus])

  useEffect(() => {
    handleCanvasFocus()
  }, [focus])

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

          // Call the callback with the File object
          if (onImageUpload) {
            onImageUpload(file)
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

  // Check if mouse is over any circle
  const isMouseOverCircle = useCallback(
    (mouseX: number, mouseY: number): boolean => {
      const canvas = canvasRef.current
      if (!canvas) return false

      // Convert screen coordinates to world coordinates
      const worldX = (mouseX - offsetRef.current.x) / scaleRef.current
      const worldY = (mouseY - offsetRef.current.y) / scaleRef.current

      // Check if mouse is over any circle
      return circles.some(circle => {
        const distance = Math.sqrt((worldX - circle.x) ** 2 + (worldY - circle.y) ** 2)
        return distance <= circle.r
      })
    },
    [circles]
  )

  const highlightedRoomsCount = circles.filter(
    (c) => selectedRoomType && c.room_type === selectedRoomType && c.status === "available",
  ).length


  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      if (isDraggingRef.current) {
        // Handle dragging
        offsetRef.current.x += e.clientX - dragStartRef.current.x
        offsetRef.current.y += e.clientY - dragStartRef.current.y
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        draw()
      } else {
        // Check if mouse is over any circle and update cursor
        const rect = canvas.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        if (isMouseOverCircle(mouseX, mouseY)) {
          canvas.style.cursor = 'pointer'
        } else {
          canvas.style.cursor = 'grab'
        }
      }
    },
    [draw, isMouseOverCircle]
  )

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // Handle circle click logic
  const handleCircleClick = useCallback(
    async (circle: Circle) => {
      // 🏨 Hotel Mode: เช็คว่าห้องตรงกับ room type ที่เลือกหรือไม่
      if (businessType === "hotel" && selectedRoomType && circle.room_type !== selectedRoomType) {
        toast.error(`ห้องนี้เป็นประเภท ${circle.room_type} ไม่ตรงกับที่ต้องการ (${selectedRoomType})`)
        return
      }

      try {
        let newStatus: Circle["status"]
        let newBookedBy: string | undefined
        let newBookedAt: number | undefined

        if (circle.status === "available" || circle.status === "some available") {
          newStatus = "pending"
          newBookedBy = currentUsername
          newBookedAt = Date.now()
          toast.success(`จอง ${circle.name} สำเร็จ!`)
        } else if (circle.status === "pending") {
          if (circle.bookedBy === currentUsername) {
            newStatus = circle.initStatus
            newBookedBy = undefined
            newBookedAt = undefined
            toast.success(`ยกเลิกการจอง ${circle.name} สำเร็จ!`)
          } else {
            toast.error(`ไม่สามารถยกเลิกการจองของ ${circle.bookedBy} ได้`)
            return
          }
        } else {
          toast.info(`${circle.name} ถูกจองแล้ว`)
          return
        }

        const updatedCircle: Circle = {
          ...circle,
          status: newStatus,
          bookedBy: newBookedBy,
          bookedAt: newBookedAt,
        }

        setCircles((prevCircles) => {
          const newCircles = prevCircles.map((c) => (c.id === circle.id ? updatedCircle : c))
          const newActiveCount = newCircles.filter((c) => c.status === "pending").length
          setActiveBookingsCount(newActiveCount)
          return newCircles
        })

        broadcastCircleUpdate(updatedCircle)
        onCircleClick?.(updatedCircle)
      } catch (error) {
        console.error("❌ Failed to update circle:", error)
        toast.error("ไม่สามารถอัปเดตสถานะได้")
      }
    },
    [currentUsername, broadcastCircleUpdate, onCircleClick, businessType, selectedRoomType],
  )

  // Handle canvas click
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) return // Don't handle click if we were dragging

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Convert screen coordinates to world coordinates
      const worldX = (mouseX - offsetRef.current.x) / scaleRef.current
      const worldY = (mouseY - offsetRef.current.y) / scaleRef.current

      // Check if click is on any circle
      for (const circle of circles) {
        const distance = Math.sqrt((worldX - circle.x) ** 2 + (worldY - circle.y) ** 2)
        if (distance <= circle.r) {
          handleCircleClick(circle)
          break
        }
      }
    },
    [circles, handleCircleClick]
  )

  const handleFilterDay = (day: number) => {
    setFilterDay(day)
  }

  // Handle status change with temporary booking logic
  const handleStatusChange = useCallback(
    (circle: Circle) => {
      const now = Date.now()
      let updatedCircle: Circle
      
      if (circle.status === "available") {
        // Anyone can book available spots
        updatedCircle = {
          ...circle,
          status: "pending",
          bookedBy: currentUsername,
          bookedAt: now
        }
        toast.success(`📍 ${currentUsername} จอง ${circle.name} ไว้ชั่วคราว`)
      } else if (circle.status === "pending") {
        // Only the person who booked can cancel
        if (circle.bookedBy === currentUsername) {
          updatedCircle = {
            ...circle,
            status: "available",
            bookedBy: undefined,
            bookedAt: undefined
          }
          toast.success(`❌ ${currentUsername} ยกเลิกการจอง ${circle.name}`)
        } else {
          toast.error(`⚠️ ไม่สามารถยกเลิกได้ ${circle.name} ถูกจองโดย ${circle.bookedBy}`)
          return // Don't update if not the owner
        }
      } else if (circle.status === "booked") {
        // Booked circles from API are permanent and cannot be changed
        toast.info(`${circle.name} ถูกจองแล้ว ไม่สามารถเปลี่ยนแปลงได้`)
        return
      } else {
        // Unknown status - shouldn't happen
        return
      }
      
      // Update local state immediately (no DB update)
      setCircles((prevCircles) => 
        prevCircles.map((c) => (c.id === circle.id ? updatedCircle : c))
      )
      
      // Broadcast to other clients via Socket.IO
      broadcastCircleUpdate(updatedCircle)
      
      // Call callback
      onCircleClick?.(updatedCircle)
      
      console.log(`🔄 Status changed:`, {
        id: circle.id,
        from: circle.status,
        to: updatedCircle.status,
        user: currentUsername,
        bookedBy: updatedCircle.bookedBy
      })
    },
    [currentUsername, broadcastCircleUpdate, onCircleClick],
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
        className={`w-full h-full border-2 border-gray-300 ${
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
        {/* User Info */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-gray-200">
          <CardContent className="p-3">
            {/* User Info and Connection Status in one row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{currentUsername}</span>
              </div>
              
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-100">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isLoading ? 'bg-yellow-500 animate-pulse' : 
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-600">
                  {isLoading ? 'กำลังเชื่อมต่อ' : 
                   isConnected ? 'ออนไลน์' : 'ออฟไลน์'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              {/* System Info */}
              <div className="text-xs text-gray-500">
                ระบบจองชั่วคราว
              </div>
              
              {/* Active Bookings Count */}
              <div className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                <span className="text-xs text-blue-700">
                  จองแล้ว <span className="font-medium">{activeBookingsCount}</span> จุด
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
                onChange={(e) => {
                  setFilterMode(e.target.checked ? "month" : "day")
                  if (e.target.checked) {
                    setFilterDay(0)
                  }
                }}
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
                      className={cn("w-6 h-6 text-xs border border-gray-300 rounded hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center justify-center", {
                        "bg-blue-500 text-white border-blue-600": filterDay === day,
                        "bg-white text-gray-700": filterDay !== day,
                      })}
                      onClick={() => {
                        // Handle day selection
                        handleFilterDay(day)
                        if (onChangeFilterDay){
                          onChangeFilterDay(day)
                        }
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
            <p>• คลิกวงกลมเขียวเพื่อจองชั่วคราว</p>
            <p>• คลิกวงกลมสีส้มที่คุณจองเพื่อยกเลิก</p>
            <p>• คนอื่นไม่สามารถยกเลิกการจองของคนอื่น</p>
            <p>• บนมือถือ: หยิกเพื่อซูม</p>
          </div>
        </div>
      )}
    </div>
  )
}
