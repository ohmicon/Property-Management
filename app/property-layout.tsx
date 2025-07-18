"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, MapPin, Info, Menu, X, Upload } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CanvasMap from "@/components/canvas-map"
import { useToast } from "@/hooks/use-toast"

interface Circle {
  x: number
  y: number
  r: number
  status: "available" | "booked" | "pending"
  id: string
}

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
  const [activeTab, setActiveTab] = useState("monthly")
  const [selectedMonth, setSelectedMonth] = useState("6")
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedZone, setSelectedZone] = useState("")
  const [showLegend, setShowLegend] = useState(true)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [showPropertyList, setShowPropertyList] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Circle | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mapFilterMode, setMapFilterMode] = useState<"day" | "month">("month")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const { toast } = useToast()

  // Mock property data for the selected area
  const [propertyList, setPropertyList] = useState<Property[]>([])
  const [bookingData, setBookingData] = useState<Property[]>([])

  // Calendar highlighted days (booking days)
  // const highlightedDays = [11, 12, 13, 14, 18, 19, 20, 21, 25, 26, 27, 28]

  // เพิ่ม state สำหรับปฏิทิน
  const [selectedDates, setSelectedDates] = useState<number[]>([11, 12, 13, 14, 18, 19, 20, 21, 25, 26, 27, 28])
  const [currentMonth, setCurrentMonth] = useState(6) // June
  const [currentYear, setCurrentYear] = useState(2025)
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
    if (isSelectingRange) {
      if (rangeStart === null) {
        setRangeStart(day)
        setSelectedDates([day])
      } else {
        const start = Math.min(rangeStart, day)
        const end = Math.max(rangeStart, day)
        const range = Array.from({ length: end - start + 1 }, (_, i) => start + i)
        setSelectedDates(range)
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
    const weekdays = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDay + day - 2) % 7 // 0 = Monday, 6 = Sunday
      if (dayOfWeek < 5) {
        // Monday to Friday
        weekdays.push(day)
      }
    }
    setSelectedDates(weekdays)
  }

  const selectWeekends = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const weekends = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDay + day - 2) % 7
      if (dayOfWeek >= 5) {
        // Saturday and Sunday
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

  // Generate detailed booking data
  const generateBookingDetails = useMemo(() => {
    const details: BookingDetail[] = []
    const bookingDates = ["17 ธันวาคม 2558", "18 ธันวาคม 2558", "19 ธันวาคม 2558", "20 ธันวาคม 2558"]

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
  }, [confirmedProperties])

  const totalBookingAmount = useMemo(() => {
    return generateBookingDetails.reduce((sum, detail) => sum + detail.amount, 0)
  }, [generateBookingDetails])

  const handlePropertyClick = (property: Circle) => {
    setSelectedProperty(property)

    // เพิ่มรายการเข้าไปใน propertyList ถ้ายังไม่มี
    setPropertyList((prevList) => {
      const exists = prevList.find((item) => item.id === property.id)
      if (!exists) {
        const newProperty: Property = {
          id: property.id,
          price: Math.floor(Math.random() * 1000 + 1000).toString(), // Random price 1000-2000
          status: property.status,
        }
        return [...prevList, newProperty]
      }
      return prevList
    })

    setShowPropertyList(true)
    setShowDetailPanel(false)
  }

  const handleRemoveProperty = (propertyId: string) => {
    setPropertyList((prevList) => prevList.filter((item) => item.id !== propertyId))
  }

  const handleViewDetails = () => {
    // ส่งข้อมูล propertyList ไปที่ booking
    setBookingData([...propertyList])
    setShowPropertyList(false)
    setShowDetailPanel(true)
  }

  const handleImageUpload = (imageUrl: string) => {
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
    setIsProcessingPayment(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Show success toast
    toast({
      title: "🎉 จองสำเร็จ!",
      description: `จองแปลงที่ ${bookingData.map((p) => p.id).join(", ")} เป็นจำนวน ${bookingSummary.totalDays} วัน ราคารวม ${totalBookingAmount.toLocaleString()} บาท`,
      duration: 5000,
    })

    // Clear all data
    setPropertyList([])
    setBookingData([])
    setSelectedProperty(null)
    setShowDetailPanel(false)
    setShowPropertyList(false)
    setIsProcessingPayment(false)
    setShowConfirmation(false)
    setConfirmedProperties([])
  }

  const handlePayment = async () => {
    setIsProcessingPayment(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Show success toast
    toast({
      title: "🎉 จองสำเร็จ!",
      description: `จองแปลงที่ ${bookingData.map((p) => p.id).join(", ")} เป็นจำนวน ${bookingSummary.totalDays} วัน ราคารวม ${bookingSummary.totalPrice} บาท`,
      duration: 5000,
    })

    // Clear all data
    setPropertyList([])
    setBookingData([])
    setSelectedProperty(null)
    setShowDetailPanel(false)
    setShowPropertyList(false)
    setIsProcessingPayment(false)
    setShowConfirmation(false)
    setConfirmedProperties([])
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "ว่าง"
      case "booked":
        return "ขายแล้ว"
      case "pending":
        return "จอง"
      default:
        return status
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
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle className="text-lg font-semibold">Confirm Book</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmDialog(false)} className="h-6 w-6 p-0">
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {/* Summary Table */}
            <div className="mb-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-medium">แปลง</TableHead>
                    <TableHead className="text-xs font-medium">ราคา</TableHead>
                    <TableHead className="text-xs font-medium">จำนวนวัน</TableHead>
                    <TableHead className="text-xs font-medium">รวมเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="text-xs">{property.id}</TableCell>
                      <TableCell className="text-xs">{Number.parseFloat(property.price).toLocaleString()}.00</TableCell>
                      <TableCell className="text-xs">4</TableCell>
                      <TableCell className="text-xs">
                        {(Number.parseFloat(property.price) * 4).toLocaleString()}.00
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Detailed Booking List */}
            <div className="bg-teal-500 text-white p-2 mb-2">
              <h3 className="text-sm font-medium">สรุปรายการจอง</h3>
            </div>

            <div className="bg-teal-50 p-2 mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium text-teal-700">แปลง</TableHead>
                    <TableHead className="text-xs font-medium text-teal-700">วันที่จอง</TableHead>
                    <TableHead className="text-xs font-medium text-teal-700">จำนวน</TableHead>
                    <TableHead className="text-xs font-medium text-teal-700">จำนวนเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generateBookingDetails.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{detail.plotId}</TableCell>
                      <TableCell className="text-xs">{detail.date}</TableCell>
                      <TableCell className="text-xs">
                        {index % 4 === 2 || index % 4 === 3 ? (
                          <div className="flex items-center gap-1">
                            <span>0</span>
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">i</span>
                            </div>
                          </div>
                        ) : (
                          "1"
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {index % 4 === 2 || index % 4 === 3 ? "0.00" : `${detail.amount.toLocaleString()}.00`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-4 p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">รวมทั้งหมด :</span>
              <span className="text-lg font-bold text-red-600">{totalBookingAmount.toLocaleString()}.00 บาท</span>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmBooking}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
            >
              ยืนยันการจอง
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with notification */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="p-3 lg:p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                <Info className="w-3 h-3 mr-1" />
                แสดงทั้งหมด
              </Badge>
              <span className="text-sm text-gray-600">อัพเดทล่าสุด: วันนี้ 14:30</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                ออนไลน์
              </Badge>
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
                      <p className="text-xs text-gray-500">Sold</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors">
                    <div className="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-500 shadow-sm"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">จอง</span>
                      <p className="text-xs text-gray-500">Reserved</p>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPropertyList(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-4">
                <div className="space-y-3">
                  {propertyList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">ยังไม่มีรายการ</p>
                      <p className="text-xs">คลิกจุดบนแผนที่เพื่อเพิ่มรายการ</p>
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
                  onClick={() => setShowDetailPanel(false)}
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

                            if (!isCurrentMonth) {
                              return <div key={i} className="text-xs text-center p-1"></div>
                            }

                            return (
                              <button
                                key={i}
                                onClick={() => handleDateClick(day)}
                                className={`text-xs text-center p-1 rounded transition-all duration-200 hover:scale-110 ${
                                  isSelected
                                    ? "bg-blue-500 text-white shadow-md transform scale-105"
                                    : isRangeStart
                                      ? "bg-blue-300 text-white"
                                      : isToday
                                        ? "bg-yellow-200 text-gray-800 font-bold"
                                        : "text-gray-700 hover:bg-blue-100"
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
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleConfirm}
                        disabled={bookingData.length === 0}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                      >
                        Confirm
                      </Button>
                      <Button
                        onClick={handlePayment}
                        disabled={isProcessingPayment || bookingData.length === 0}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                      >
                        {isProcessingPayment ? "กำลังดำเนินการ..." : "Payment"}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel Toggle Button */}
          <Button
            onClick={() => setShowDetailPanel(!showDetailPanel)}
            className={`absolute top-4 transition-all duration-300 h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 shadow-lg z-10 ${showDetailPanel ? "right-[25rem]" : showPropertyList ? "right-[25rem]" : "right-4"}`}
            size="sm"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
