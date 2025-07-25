"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, MapPin, Info, Menu, X, Upload, Send, RefreshCw } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CanvasMap, { Circle } from "@/components/canvas-map"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeBooking } from "@/hooks/use-realtime-booking"
import { getCurrentUsername } from "@/lib/user-utils"
import ConnectionGuard from "@/components/connection-guard"
import { updateCircleStatus, getCircles } from "@/lib/api/circles"

interface Property {
  id: string
  price: string
  status: "available" | "booked" | "pending"
}

interface BookingDetail {
  plotId: string
  date: string
  amount: number
}

export default function PropertyLayout() {
  const { isConnected, isLoading, connectionError, retryCount, maxRetries, onSelectBooking } = useRealtimeBooking()

  const [activeTab, setActiveTab] = useState("monthly")
  const [selectedMonth, setSelectedMonth] = useState(() => (new Date().getMonth() + 1).toString()) // เดือนปัจจุบัน
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString()) // ปีปัจจุบัน
  const [selectedZone, setSelectedZone] = useState("")
  const [showLegend, setShowLegend] = useState(true)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [showPropertyList, setShowPropertyList] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Circle | null>(null)
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set())
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mapFilterMode, setMapFilterMode] = useState<"day" | "month">("month")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(() => new Date())
  const { toast } = useToast()

  // Mock property data for the selected area
  const [propertyList, setPropertyList] = useState<Property[]>([])
  const [bookingData, setBookingData] = useState<Property[]>([])
  
  // Ref for external circle update handler
  const externalCircleUpdateRef = useRef<((circle: Circle) => void) | null>(null)
  
  // State สำหรับ circles จาก CanvasMap
  const [circles, setCircles] = useState<Circle[]>([])
  
  // ฟังก์ชันสำหรับรีเฟรชข้อมูล
  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true)
      toast({
        title: "⏳ กำลังรีเฟรชข้อมูล...",
        description: "กรุณารอสักครู่",
        duration: 2000,
      })
      
      // ดึงข้อมูลล่าสุดจาก API
      const freshCircles = await getCircles()
      console.log('📊 ข้อมูลล่าสุดจาก API:', freshCircles)
      
      // อัพเดทข้อมูล circles
      setCircles(prevCircles => {
        const currentUser = getCurrentUsername()
        console.log('👤 Current user:', currentUser)
        console.log('🔍 Selected property IDs:', Array.from(selectedPropertyIds))
        
        const updatedCircles = freshCircles.map(newCircle => {
          const existingCircle = prevCircles.find(c => c.id === newCircle.id)
          console.log(`🔄 Processing circle ${newCircle.id}: DB status = ${newCircle.status}, Current status = ${existingCircle?.status || 'N/A'}`)
          
          // กรณีที่ 1: ถ้าใน DB เป็น booked ให้ใช้สถานะจาก DB
          if (newCircle.status === 'booked') {
            console.log(`✅ Circle ${newCircle.id} is booked in DB, keeping as booked`)
            return {
              ...newCircle,
              status: 'booked' as const,
              bookedBy: newCircle.bookedBy || 'system',
              bookedAt: newCircle.bookedAt || new Date().toISOString()
            }
          }
          
          // กรณีที่ 2: ถ้าเป็น pending และเป็นของ user ปัจจุบัน ให้คงสถานะไว้
          if (existingCircle && existingCircle.status === 'pending' && existingCircle.bookedBy === currentUser) {
            console.log(`🕒 Circle ${newCircle.id} is pending by current user, keeping as pending`)
            return {
              ...newCircle,
              status: 'pending' as const,
              bookedBy: currentUser,
              bookedAt: existingCircle.bookedAt
            }
          }
          
          // กรณีที่ 3: ถ้าเป็น available แต่อยู่ใน selectedPropertyIds ให้เปลี่ยนเป็น pending
          if (newCircle.status === 'available' && selectedPropertyIds.has(newCircle.id)) {
            console.log(`🔄 Circle ${newCircle.id} is available but selected, marking as pending`)
            return {
              ...newCircle,
              status: 'pending' as const,
              bookedBy: currentUser,
              bookedAt: new Date().toISOString()
            }
          }
          
          // กรณีอื่นๆ ให้ใช้ข้อมูลใหม่จาก API
          console.log(`ℹ️ Circle ${newCircle.id} using DB status: ${newCircle.status}`)
          return newCircle
        })
        
        return updatedCircles as Circle[]
      })
      
      // อัพเดทเวลารีเฟรชล่าสุด
      setLastRefreshTime(new Date())
      
      toast({
        title: "🎉 รีเฟรชข้อมูลสำเร็จ",
        description: "ข้อมูลแปลงที่ดินได้รับการอัพเดทแล้ว",
        duration: 3000
      })
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการรีเฟรชข้อมูล:", error)
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถรีเฟรชข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        duration: 3000
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calendar highlighted days (booking days)
  // const highlightedDays = [11, 12, 13, 14, 18, 19, 20, 21, 25, 26, 27, 28]

  // เพิ่ม state สำหรับปฏิทิน - เริ่มต้นด้วยเดือนปัจจุบันและไม่เลือกวันใด
  const [selectedDates, setSelectedDates] = useState<number[]>([])
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1) // เดือนปัจจุบัน
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear()) // ปีปัจจุบัน
  const [isSelectingRange, setIsSelectingRange] = useState(false)
  const [rangeStart, setRangeStart] = useState<number | null>(null)

  // เพิ่มฟังก์ชันสำหรับจัดการปฏิทิน
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const getMonthName = (month: number) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return months[month - 1]
  }

  const handleDateClick = (day: number) => {
    // ตรวจสอบว่าวันที่เลือกเป็นวันที่ผ่านมาแล้วหรือไม่
    const today = new Date()
    const selectedDate = new Date(currentYear, currentMonth - 1, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    if (selectedDate < todayStart) {
      // ไม่สามารถเลือกวันที่ผ่านมาแล้ว
      return
    }

    if (isSelectingRange) {
      if (rangeStart === null) {
        setRangeStart(day)
        setSelectedDates([day])
      } else {
        const start = Math.min(rangeStart, day)
        const end = Math.max(rangeStart, day)
        const range = Array.from({ length: end - start + 1 }, (_, i) => start + i)
        // กรองเฉพาะวันที่ไม่ผ่านมาแล้ว
        const validRange = range.filter(d => {
          const checkDate = new Date(currentYear, currentMonth - 1, d)
          return checkDate >= todayStart
        })
        setSelectedDates(validRange)
        setRangeStart(null)
        setIsSelectingRange(false)
      }
    } else {
      setSelectedDates((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
      )
    }
  }

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((prev) => prev - 1)
    } else {
      setCurrentMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((prev) => prev + 1)
    } else {
      setCurrentMonth((prev) => prev + 1)
    }
  }

  const clearAllDates = () => {
    setSelectedDates([])
    setRangeStart(null)
    setIsSelectingRange(false)
  }

  const selectWeekdays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const weekdays = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDay + day - 2) % 7 // 0 = Monday, 6 = Sunday
      const checkDate = new Date(currentYear, currentMonth - 1, day)
      
      if (dayOfWeek < 5 && checkDate >= todayStart) {
        // Monday to Friday และไม่ผ่านมาแล้ว
        weekdays.push(day)
      }
    }
    setSelectedDates(weekdays)
  }

  const selectWeekends = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const weekends = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDay + day - 2) % 7
      const checkDate = new Date(currentYear, currentMonth - 1, day)
      
      if (dayOfWeek >= 5 && checkDate >= todayStart) {
        // Saturday and Sunday และไม่ผ่านมาแล้ว
        weekends.push(day)
      }
    }
    setSelectedDates(weekends)
  }

  // Calculate booking summary
  // const bookingSummary = useMemo(() => {
  //   const totalDays = highlightedDays.length
  //   const totalPrice = bookingData.reduce((sum, property) => {
  //     return sum + Number.parseFloat(property.price.replace(",", "")) * totalDays
  //   }, 0)

  //   return {
  //     totalDays,
  //     totalPrice: totalPrice.toLocaleString(),
  //     properties: bookingData.length,
  //   }
  // }, [bookingData, highlightedDays])

  // อัพเดท bookingSummary ให้ใช้ selectedDates
  const bookingSummary = useMemo(() => {
    const totalDays = selectedDates.length
    const totalPrice = bookingData.reduce((sum, property) => {
      return sum + Number.parseFloat(property.price.replace(",", "")) * totalDays
    }, 0)

    return {
      totalDays,
      totalPrice: totalPrice.toLocaleString(),
      properties: bookingData.length,
    }
  }, [bookingData, selectedDates])

  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmedProperties, setConfirmedProperties] = useState<Property[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // Sync propertyList กับ circles ที่มีสถานะ pending และถูกเลือกโดย user
  useEffect(() => {
    // หาจุดที่มีสถานะ pending และถูกเลือกโดย user ปัจจุบัน
    const currentUser = getCurrentUsername()
    console.log('🔄 Syncing propertyList with circles - current user:', currentUser)
    console.log('🔄 Selected property IDs:', Array.from(selectedPropertyIds))
    
    const pendingCircles = circles.filter(circle => 
      circle.status === 'pending' && 
      circle.bookedBy === currentUser &&
      selectedPropertyIds.has(circle.id)
    )
    
    console.log('🔄 Found pending circles for current user:', pendingCircles.length)
    
    // สร้าง propertyList จาก pending circles
    const newPropertyList: Property[] = pendingCircles.map(circle => ({
      id: circle.id,
      price: Math.floor(Math.random() * 1000 + 1000).toString(),
      status: circle.status,
    }))
    
    console.log('🔄 New property list:', newPropertyList)
    
    // อัปเดต propertyList และ bookingData พร้อมกัน
    setPropertyList(newPropertyList)
    setBookingData(newPropertyList)
    
    // แสดง Property List ถ้ามีจุดที่เลือก
    if (newPropertyList.length > 0) {
      setShowPropertyList(true)
    } else if (showPropertyList) {
      // ถ้าไม่มีจุดที่เลือกแล้ว และกำลังแสดง Property List อยู่ ให้ซ่อน
      setShowPropertyList(false)
    }
  }, [circles, selectedPropertyIds, showPropertyList])

  // Generate detailed booking data
  const generateBookingDetails = useMemo(() => {
    const details: BookingDetail[] = []
    
    // ใช้วันที่ที่ผู้ใช้เลือกจริงๆ แทนวันที่คงที่
    const selectedDateStrings = selectedDates.map(day => `${day} ${getMonthName(currentMonth)} ${currentYear}`)
    
    // ถ้าไม่มีวันที่เลือก ให้ใช้วันนี้เป็นค่าเริ่มต้น
    const bookingDates = selectedDateStrings.length > 0 ? selectedDateStrings : [`${new Date().getDate()} ${getMonthName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`]

    confirmedProperties.forEach((property) => {
      bookingDates.forEach((date) => {
        details.push({
          plotId: property.id,
          date: date,
          amount: Number.parseFloat(property.price.replace(",", "")),
        })
      })
    })

    return details
  }, [confirmedProperties, selectedDates, currentMonth, currentYear])

  // คำนวณยอดรวมทั้งหมดโดยใช้ bookingSummary.totalDays แทน
  const totalBookingAmount = useMemo(() => {
    return confirmedProperties.reduce((sum, property) => {
      return sum + (Number.parseFloat(property.price.replace(",", "")) * bookingSummary.totalDays)
    }, 0)
  }, [confirmedProperties, bookingSummary.totalDays])

  const handlePropertyClick = (property: Circle) => {
    // ตรวจสอบว่าจุดนี้ถูกเลือกแล้วหรือไม่
    if (selectedPropertyIds.has(property.id)) {
      // ถ้าถูกเลือกแล้ว ให้ยกเลิกการเลือก
      handleRemoveProperty(property.id)
      return
    }

    setSelectedProperty(property)

    // เพิ่มรายการเข้าไปใน propertyList ถ้ายังไม่มี
    // แต่ต้องรอให้จุดเปลี่ยนเป็น pending ก่อน (จะเพิ่มใน useEffect)
    // setPropertyList จะทำใน useEffect ที่ listen การเปลี่ยนแปลงสถานะ

    // เพิ่ม ID เข้าไปใน selectedPropertyIds
    setSelectedPropertyIds(prev => new Set([...prev, property.id]))

    onSelectBooking(property)

    setShowPropertyList(true)
    // ปิดกรอบการจองเมื่อแสดงรายการแปลง
    setShowDetailPanel(false)
  }

  const handleRemoveProperty = (propertyId: string) => {
    console.log('🗑️ Removing property:', propertyId)
    
    // ลบจาก propertyList และตรวจสอบว่าต้องซ่อน Property List หรือไม่
    setPropertyList((prevList) => {
      const filteredList = prevList.filter((item) => item.id !== propertyId)
      console.log('🗑️ Updated property list:', filteredList)
      
      // ซิงค์ bookingData ให้ตรงกับ propertyList ที่อัปเดต
      setBookingData(filteredList)
      
      if (filteredList.length === 0) {
        console.log('🗑️ No properties left, hiding property list')
        setShowPropertyList(false)
      }
      
      return filteredList
    })
    
    // ลบจาก selectedPropertyIds เพื่อให้สามารถคลิกได้อีก
    setSelectedPropertyIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(propertyId)
      console.log('🗑️ Updated selected property IDs:', Array.from(newSet))
      return newSet
    })
    
    // ค้นหาจุดที่ต้องการยกเลิกจาก circles ที่มีอยู่
    const circleToCancel = circles.find(circle => circle.id === propertyId)
    
    // ส่งสัญญาณไปยัง Canvas Map เพื่อยกเลิกการจองโดยตรง
    const cancelledProperty: Circle = circleToCancel ? {
      ...circleToCancel, // รักษาตำแหน่งและขนาดจริง
      status: 'available',
      bookedBy: undefined,
      bookedAt: undefined
    } : {
      // ถ้าไม่พบจุดในข้อมูลปัจจุบัน ใช้ค่า default
      id: propertyId,
      x: 100,
      y: 100,
      r: 20,
      status: 'available' as const,
      bookedBy: undefined,
      bookedAt: undefined
    }
    
    console.log('🗑️ Sending cancelled property to CanvasMap:', cancelledProperty);
    
    // อัปเดต Canvas Map โดยตรงผ่าน external update handler
    // (การเรียก broadcastCircleUpdate จะทำใน external handler แล้ว)
    if (externalCircleUpdateRef.current) {
      externalCircleUpdateRef.current(cancelledProperty)
    }
    
    toast({
      title: "ยกเลิกการเลือก",
      description: `ยกเลิกการเลือกจุด ${propertyId} แล้ว`,
    })
  }

  const handleViewDetails = () => {
    // ส่งข้อมูล propertyList ไปที่ booking และตรวจสอบว่ามีข้อมูลหรือไม่
    if (propertyList.length === 0) {
      toast({
        title: "ไม่มีแปลงที่เลือก",
        description: "กรุณาเลือกแปลงที่ต้องการจองก่อน",
        variant: "destructive"
      })
      return
    }
    
    console.log('📋 Viewing details for properties:', propertyList)
    setBookingData([...propertyList])
    setShowPropertyList(false)
    setShowDetailPanel(true)
  }
  
  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false)
    // ตรวจสอบว่ายังมีรายการที่เลือกอยู่หรือไม่ ถ้ามีให้แสดง Property List กลับมา
    if (propertyList.length > 0) {
      setShowPropertyList(true)
    }
  }

  const handleImageUpload = (file: File) => {
    // สร้าง URL จาก File สำหรับการแสดงผล
    const imageUrl = URL.createObjectURL(file)
    setUploadedImage(imageUrl)
  }

  const handleMapFilterChange = (mode: "day" | "month") => {
    setMapFilterMode(mode)
    // You can add additional logic here to filter data based on the mode
  }

  const handleConfirm = () => {
    setConfirmedProperties([...bookingData])
    setShowConfirmation(true)
  }

  const handleVerifyBooking = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmBooking = async () => {
    setShowConfirmDialog(false)
  
    try {
      // แสดง toast กำลังดำเนินการ
      toast({
        title: "⏳ กำลังบันทึกการจอง...",
        description: "กรุณารอสักครู่",
        duration: 3000,
      })
    
      // สร้าง array สำหรับเก็บจุดที่อัพเดทสำเร็จ
      const updatedCircles: Circle[] = []
    
      // วนลูปทุกแปลงที่จะจอง และเรียก API เพื่อเปลี่ยนสถานะเป็น booked
      for (const property of bookingData) {
        try {
          // เรียก API เพื่ออัพเดทสถานะเป็น booked
          const updatedCircle = await updateCircleStatus(property.id, 'booked')
        
          // เก็บจุดที่อัพเดทสำเร็จ
          updatedCircles.push(updatedCircle)
        
          // ส่งข้อมูลไปยังผู้ใช้อื่นๆ ผ่าน socket เพื่อให้เห็นการเปลี่ยนแปลงทันที
          if (externalCircleUpdateRef.current) {
            externalCircleUpdateRef.current(updatedCircle)
          }
        } catch (error) {
          console.error(`ไม่สามารถอัพเดทแปลง ${property.id} ได้:`, error)
        }
      }
      
      // แสดง toast สำเร็จ ถ้ามีการอัพเดทอย่างน้อย 1 จุด
      if (updatedCircles.length > 0) {
        toast({
          title: "🎉 จองสำเร็จ!",
          description: `จองแปลงที่ ${updatedCircles.map(c => c.id).join(", ")} เป็นจำนวน ${bookingSummary.totalDays} วัน ราคารวม ${bookingSummary.totalPrice} บาท`,
          duration: 5000,
        })
      } else {
        // ถ้าไม่มีจุดไหนอัพเดทสำเร็จเลย
        toast({
          title: "❌ ไม่สามารถจองได้",
          description: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการจอง:", error)
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการจองได้ กรุณาลองใหม่อีกครั้ง",
        duration: 5000,
      })
    } finally {
      // Clear all data
      setPropertyList([])
      setBookingData([])
      setSelectedProperty(null)
      setShowDetailPanel(false)
      setShowPropertyList(false)
      setShowConfirmation(false)
      setConfirmedProperties([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 border-green-200"
      case "booked":
        return "bg-red-100 text-red-700 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <ConnectionGuard
      isLoading={isLoading}
      isConnected={isConnected}
      connectionError={connectionError}
      retryCount={retryCount}
      maxRetries={maxRetries}
    >
      <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left Sidebar */}
      <div className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 shadow-lg lg:shadow-lg">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-1">ระบบจัดการโครงการ</h2>
            <p className="text-sm text-gray-500">Property Management System</p>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <Button
              variant={activeTab === "monthly" ? "default" : "ghost"}
              onClick={() => setActiveTab("monthly")}
              className={`flex-1 transition-all duration-200 ${
                activeTab === "monthly" ? "bg-blue-500 text-white shadow-md" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              รายเดือน
            </Button>
            <Button
              variant={activeTab === "daily" ? "default" : "ghost"}
              onClick={() => setActiveTab("daily")}
              className={`flex-1 transition-all duration-200 ${
                activeTab === "daily" ? "bg-blue-500 text-white shadow-md" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              รายวัน
            </Button>
          </div>

          {/* Filters Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                ตัวกรองข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Month Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  เดือน
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        เดือน {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ปี</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">พ.ศ. 2567</SelectItem>
                    <SelectItem value="2025">พ.ศ. 2568</SelectItem>
                    <SelectItem value="2026">พ.ศ. 2569</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zone Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">โซน</label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="w-full hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="เลือกโซน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zone-a">โซน A</SelectItem>
                    <SelectItem value="zone-b">โซน B</SelectItem>
                    <SelectItem value="zone-c">โซน C</SelectItem>
                    <SelectItem value="zone-d">โซน D</SelectItem>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md transition-all duration-200 transform hover:scale-105">
                <Search className="w-4 h-4 mr-2" />
              </Button>

              {/* Upload Image Button */}
              {/* <Button
                variant="outline"
                className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 shadow-md transition-all duration-200 transform hover:scale-105 bg-transparent"
                onClick={() => {
                  // Trigger upload from CanvasMap
                  const event = new CustomEvent("triggerUpload")
                  window.dispatchEvent(event)
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                อัพโหลดแผนที่
              </Button> */}

              {/* Confirmation Summary */}
              {showConfirmation && (
                <Card className="shadow-sm border-gray-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-800">สรุปการเลือกแปลง</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {confirmedProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <span className="text-sm font-medium text-gray-800">แปลงแปลง {property.id}</span>
                        <span className="text-sm font-medium text-gray-600">฿ {property.price} บาท</span>
                      </div>
                    ))}

                    <Button
                      onClick={handleVerifyBooking}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg mt-4"
                    >
                      ตรวจสอบ
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Book Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(open) => {
        // ถ้ากดข้างนอก dialog จะไม่ปิด (ต้องกดปุ่มเท่านั้น)
        // แต่ถ้าเป็นการเปิด dialog ให้ทำงานปกติ
        if (open === false && showConfirmDialog === true) {
          // ไม่ทำอะไร เพื่อป้องกันการปิดเมื่อคลิกข้างนอก
          return;
        }
        setShowConfirmDialog(open);
      }}>
        <DialogContent 
          isShowIconClose={false} 
          className="max-w-md max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-b from-white to-blue-50 border-2 border-blue-200 shadow-xl">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-blue-200">
            <DialogTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              ยืนยันการจองแปลง
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-1">
            {/* ข้อความยืนยัน */}
            <div className="bg-blue-100 border-l-4 border-blue-500 p-3 mb-4 rounded-r-md">
              <p className="text-sm text-blue-800">คุณกำลังจะยืนยันการจองแปลงที่เลือก โปรดตรวจสอบรายละเอียดให้ถูกต้อง</p>
            </div>
            
            {/* Summary Table */}
            <div className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden border border-blue-100">
              <div className="bg-blue-500 text-white py-2 px-3">
                <h3 className="text-sm font-medium">รายการแปลงที่เลือก</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="text-xs font-medium text-blue-700">แปลง</TableHead>
                    <TableHead className="text-xs font-medium text-blue-700">ราคา/วัน</TableHead>
                    <TableHead className="text-xs font-medium text-blue-700">จำนวนวัน</TableHead>
                    <TableHead className="text-xs font-medium text-blue-700">รวมเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedProperties.map((property) => (
                    <TableRow key={property.id} className="hover:bg-blue-50 transition-colors">
                      <TableCell className="text-sm font-medium text-blue-800">{property.id}</TableCell>
                      <TableCell className="text-sm">{Number.parseFloat(property.price).toLocaleString()}.00</TableCell>
                      <TableCell className="text-sm">{bookingSummary.totalDays}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {(Number.parseFloat(property.price) * bookingSummary.totalDays).toLocaleString()}.00
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Detailed Booking List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-blue-100 mb-4">
              <div className="bg-blue-500 text-white py-2 px-3">
                <h3 className="text-sm font-medium">รายละเอียดวันที่จอง</h3>
              </div>
              
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">วันที่เลือก:</span>
                  <span className="text-gray-700">
                    {selectedDates.length > 0 
                      ? selectedDates.length <= 5
                        ? selectedDates.map(day => `${day}/${currentMonth}/${currentYear}`).join(", ")
                        : `${selectedDates[0]}/${currentMonth}/${currentYear} - ${selectedDates[selectedDates.length - 1]}/${currentMonth}/${currentYear} (${selectedDates.length} วัน)`
                      : "ไม่มีวันที่เลือก"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">จำนวนแปลง:</span>
                  <span className="text-gray-700">{confirmedProperties.length} แปลง</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 border-t border-blue-100">
                <div className="grid grid-cols-2 gap-2">
                  {confirmedProperties.map((property) => (
                    <div key={property.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-gray-700">แปลงที่ {property.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-4 p-4 bg-blue-600 rounded-lg shadow-md">
              <span className="text-sm font-medium text-white">รวมทั้งหมด:</span>
              <span className="text-xl font-bold text-white">{totalBookingAmount.toLocaleString()}.00 บาท</span>
            </div>

            {/* Confirm Button */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setShowConfirmDialog(false)}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleConfirmBooking}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all duration-200 transform hover:translate-y-[-2px]"
              >
                ยืนยันการจอง
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with notification */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="p-3 lg:p-4 flex items-center justify-start gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                <Info className="w-3 h-3 mr-1" />
                แสดงทั้งหมด
              </Badge>
              <span className="text-sm text-gray-600">อัพเดทล่าสุด: {lastRefreshTime.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshData} 
                disabled={isRefreshing}
                className="flex items-center gap-1 text-xs mr-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
            </div>
          </div>
        </div>

        {/* Interactive Map Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-50 min-h-[300px] lg:min-h-0">
          <div className="absolute inset-0">
            <div className="w-full h-full bg-white rounded-lg shadow-inner m-2 lg:m-4 overflow-hidden">
              <CanvasMap
                onCircleClick={handlePropertyClick}
                onImageUpload={handleImageUpload}
                onFilterChange={handleMapFilterChange}
                selectedPropertyIds={selectedPropertyIds}
                onExternalCircleUpdate={externalCircleUpdateRef}
                onCirclesChange={setCircles}
              />
            </div>
          </div>

          {/* Floating Legend Panel */}
          <div
            className={`absolute bottom-4 right-4 transition-all duration-300 ${showLegend ? "translate-x-0" : "translate-x-full"}`}
          >
            <Card className="w-80 shadow-lg border-gray-200 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base text-gray-800">สถานะหน่วย</CardTitle>
                  <p className="text-sm text-gray-500">Legend & Status Information</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLegend(!showLegend)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  {showLegend ? "×" : "◐"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors">
                    <div className="w-5 h-5 bg-green-400 rounded-full border-2 border-green-500 shadow-sm"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">ว่าง</span>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
                    <div className="w-5 h-5 bg-red-400 rounded-full border-2 border-red-500 shadow-sm"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">ขายแล้ว</span>
                      <p className="text-xs text-gray-500">Booked</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-500 shadow-sm"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">จอง</span>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Toggle Button when Legend is hidden */}
          {!showLegend && (
            <Button
              onClick={() => setShowLegend(true)}
              className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
              size="sm"
            >
              <Info className="w-5 h-5" />
            </Button>
          )}

          {/* Property List Panel */}
          <div
            className={`absolute top-4 right-4 transition-all duration-300 ${showPropertyList ? "translate-x-0" : "translate-x-full"}`}
          >
            <Card className="w-80 shadow-lg border-gray-200 bg-white backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 flex-shrink-0">
                <div>
                  <CardTitle className="text-base text-gray-800">รายการแปลง</CardTitle>
                  <p className="text-sm text-gray-500">Property List</p>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <div className="space-y-3">
                  {propertyList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">ยังไม่มีรายการ</p>
                      <p className="text-xs">คลิกจุดบนแผนที่เพื่อเพิ่มรายการ</p>
                      <p className="text-xs mt-1 text-gray-400">คลิกซ้ำเพื่อยกเลิกการเลือก</p>
                    </div>
                  ) : (
                    propertyList.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              property.status === "available"
                                ? "bg-green-400"
                                : property.status === "pending"
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                            }`}
                          ></div>
                          <span className="text-sm font-medium text-gray-800">แปลงที่ {property.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{property.price} บาท</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProperty(property.id)}
                            className="h-6 w-6 p-0 hover:bg-red-100 text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {propertyList.length > 0 && (
                    <Button
                      onClick={handleViewDetails}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg mt-4"
                    >
                      ดูรายการ ({propertyList.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Floating Detail Panel - Booking Interface */}
          <div
            className={`absolute top-4 right-4 bottom-4 transition-all duration-300 ${showDetailPanel ? "translate-x-0" : "translate-x-full"}`}
          >
            <Card className="w-80 h-full shadow-lg border-gray-200 bg-teal-100 backdrop-blur-sm flex flex-col rounded-3xl overflow-hidden">
              {/* Header */}
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 flex-shrink-0 bg-teal-200 border-b border-teal-300">
                <div>
                  <CardTitle className="text-base text-gray-800">การจอง ({bookingData.length} แปลง)</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseDetailPanel}
                  className="h-8 w-8 p-0 hover:bg-teal-300 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Selected Properties Summary */}
                    {bookingData.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-teal-300">
                        <h4 className="text-sm font-medium text-gray-800 mb-2">แปลงที่เลือก</h4>
                        <div className="space-y-1">
                          {bookingData.map((property) => (
                            <div key={property.id} className="flex justify-between text-xs">
                              <span>แปลงที่ {property.id}</span>
                              <span>{property.price} บาท/วัน</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Calendar Navigation */}
                    {/* <div className="flex items-center justify-between bg-white rounded-lg p-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="text-blue-500">{"<"}</span>
                      </Button>
                      <span className="text-sm font-medium">June 2025</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="text-blue-500">{">"}</span>
                      </Button>
                    </div> */}

                    {/* Calendar Navigation */}
                    <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-teal-300">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-teal-100"
                        onClick={handlePrevMonth}
                      >
                        <span className="text-blue-500">{"<"}</span>
                      </Button>
                      <span className="text-sm font-medium">
                        {getMonthName(currentMonth)} {currentYear}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-teal-100"
                        onClick={handleNextMonth}
                      >
                        <span className="text-blue-500">{">"}</span>
                      </Button>
                    </div>

                    {/* Calendar Controls */}
                    <div className="flex gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSelectingRange(!isSelectingRange)}
                        className={`text-xs px-2 py-1 ${isSelectingRange ? "bg-blue-100 border-blue-300" : ""}`}
                      >
                        {isSelectingRange ? "ยกเลิกช่วง" : "เลือกช่วง"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectWeekdays}
                        className="text-xs px-2 py-1 bg-transparent"
                      >
                        วันธรรมดา
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectWeekends}
                        className="text-xs px-2 py-1 bg-transparent"
                      >
                        วันหยุด
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllDates}
                        className="text-xs px-2 py-1 text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                      >
                        ล้าง
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    {/* <div className="bg-white rounded-lg p-3"> */}
                    {/* Calendar Header */}
                    {/* <div className="grid grid-cols-7 gap-1 mb-2">
                        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                          <div key={day} className="text-xs text-center text-gray-500 p-1">
                            {day}
                          </div>
                        ))}
                      </div> */}

                    {/* Calendar Days */}
                    {/* <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 35 }, (_, i) => {
                          const day = i - 5 + 1 // Adjust for June 2025 starting on Sunday
                          const isCurrentMonth = day > 0 && day <= 30
                          const isHighlighted = highlightedDays.includes(day)

                          return (
                            <div
                              key={i}
                              className={`text-xs text-center p-1 rounded ${
                                !isCurrentMonth
                                  ? "text-gray-300"
                                  : isHighlighted
                                    ? "bg-blue-500 text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {isCurrentMonth ? day : i < 6 ? 30 + i : i - 34}
                            </div>
                          )
                        })}
                      </div>
                    </div> */}

                    {/* Calendar Grid */}
                    <div className="bg-white rounded-lg p-3 border border-teal-300">
                      {/* Calendar Header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((day) => (
                          <div key={day} className="text-xs text-center text-gray-500 p-1 font-medium">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const daysInMonth = getDaysInMonth(currentMonth, currentYear)
                          const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
                          const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1 // Adjust for Monday start
                          const totalCells = Math.ceil((daysInMonth + adjustedFirstDay) / 7) * 7

                          return Array.from({ length: totalCells }, (_, i) => {
                            const day = i - adjustedFirstDay + 1
                            const isCurrentMonth = day > 0 && day <= daysInMonth
                            const isSelected = selectedDates.includes(day)
                            const isRangeStart = rangeStart === day
                            const isToday =
                              isCurrentMonth &&
                              day === new Date().getDate() &&
                              currentMonth === new Date().getMonth() + 1 &&
                              currentYear === new Date().getFullYear()
                            
                            // ตรวจสอบว่าเป็นวันที่ผ่านมาแล้ว
                            const today = new Date()
                            const selectedDate = new Date(currentYear, currentMonth - 1, day)
                            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                            const isPastDate = isCurrentMonth && selectedDate < todayStart

                            if (!isCurrentMonth) {
                              return <div key={i} className="text-xs text-center p-1"></div>
                            }

                            return (
                              <button
                                key={i}
                                onClick={() => handleDateClick(day)}
                                disabled={isPastDate}
                                className={`text-xs text-center p-1 rounded transition-all duration-200 ${
                                  isPastDate
                                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                                    : isSelected
                                      ? "bg-blue-500 text-white shadow-md transform scale-105 hover:scale-110"
                                      : isRangeStart
                                        ? "bg-blue-300 text-white hover:scale-110"
                                        : isToday
                                          ? "bg-yellow-200 text-gray-800 font-bold hover:scale-110"
                                          : "text-gray-700 hover:bg-blue-100 hover:scale-110"
                                }`}
                              >
                                {day}
                              </button>
                            )
                          })
                        })()}
                      </div>
                    </div>

                    {/* Selection Summary */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-blue-800">วันที่เลือก</span>
                        <span className="text-sm font-bold text-blue-600">{selectedDates.length} วัน</span>
                      </div>
                      {selectedDates.length > 0 && (
                        <div className="text-xs text-blue-600 max-h-16 overflow-y-auto">
                          {selectedDates.length <= 10
                            ? selectedDates.map((day) => `${day}/${currentMonth}`).join(", ")
                            : `${selectedDates[0]}/${currentMonth} - ${selectedDates[selectedDates.length - 1]}/${currentMonth} และอื่นๆ`}
                        </div>
                      )}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-200 rounded border"></div>
                        <span className="text-gray-700">วันนี้</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-700">วันที่เลือก</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-300 rounded"></div>
                        <span className="text-gray-700">จุดเริ่มต้นช่วง</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-100 rounded border"></div>
                        <span className="text-gray-700">ว่าง</span>
                      </div>
                    </div>

                    {isSelectingRange && rangeStart && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        <p className="text-xs text-yellow-800">
                          🎯 เลือกวันสิ้นสุดช่วง (เริ่มต้น: {rangeStart}/{currentMonth})
                        </p>
                      </div>
                    )}

                    {/* Legend */}
                    {/* <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span className="text-xs text-gray-700">ทำหลัก</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-700">วันจอง</span>
                      </div>
                    </div> */}

                    {/* Form Fields */}
                    <div className="space-y-3">
                      {/* Customer Type Group */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">กลุ่มประเภทลูกค้า</label>
                        <Select defaultValue="อาหารอีสาน">
                          <SelectTrigger className="w-full bg-white border-teal-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="อาหารอีสาน">อาหารอีสาน</SelectItem>
                            <SelectItem value="อาหารไทย">อาหารไทย</SelectItem>
                            <SelectItem value="อาหารจีน">อาหารจีน</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Product Type */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">ประเภทสินค้า</label>
                        <div className="bg-white border border-teal-300 rounded-md p-2">
                          <span className="text-sm text-gray-600">สินค้า, ลาน, น้ำตก</span>
                        </div>
                      </div>

                      {/* Customer */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">ลูกค้า</label>
                        <div className="bg-white border border-teal-300 rounded-md p-2 flex justify-end">
                          <Button className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded">
                            สร้างลูกค้าใหม่
                          </Button>
                        </div>
                      </div>

                      {/* Number of Days */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">จำนวนวัน</label>
                        <div className="bg-white border border-teal-300 rounded-md p-2 text-right">
                          <span className="text-sm font-medium">{bookingSummary.totalDays}</span>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">ราคารวม</label>
                        <div className="bg-white border border-teal-300 rounded-md p-2 text-right">
                          <span className="text-sm font-medium">{bookingSummary.totalPrice}.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4">
                      <Button
                        onClick={handleConfirm}
                        disabled={bookingData.length === 0}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel Toggle Button - แสดงเฉพาะเมื่อไม่มีกรอบใดแสดงอยู่ */}
          {!showPropertyList && !showDetailPanel && (
            <Button
              onClick={() => setShowDetailPanel(!showDetailPanel)}
              className="absolute top-4 right-4 transition-all duration-300 h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg z-10"
              size="sm"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
      </div>
    </ConnectionGuard>
  )
}
