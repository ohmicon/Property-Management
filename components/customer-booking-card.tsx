"use client"

import { ScrollArea } from "./ui/scroll-area"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { User, Phone, Bed, Calendar, Clock, Filter } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { pendingBookings, checkedInBookings, ROOM_TYPES, HOTEL_ROOM_TYPES, PendingBooking } from "@/data/booking-mock-data"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export default function CustomerBookingCard({
    onRoomTypeChange,
}: {
    onRoomTypeChange?: (roomType: string | null) => void;
}) {
    const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null);
    const [selectedRoomType, setSelectedRoomType] = useState<"Suite" | "Standard" | "Deluxe" | null>(null);
    
    const selectBooking = (booking: PendingBooking) => {
        setSelectedBooking(booking);
        // When a booking is selected, automatically set the room type filter
        // Map from lowercase room types to capitalized room types
        const roomTypeMapping: Record<string, "Suite" | "Standard" | "Deluxe" | null> = {
            "standard": "Standard",
            "deluxe": "Deluxe",
            "suite": "Suite",
            "family": null // family room type doesn't have a direct mapping in hotel room types
        };
        const bookingRoomType = roomTypeMapping[booking.roomType] || null;
        setSelectedRoomType(bookingRoomType);
        if (onRoomTypeChange) {
            onRoomTypeChange(bookingRoomType);
        }
    };

    const handleRoomTypeChange = (roomType: "Suite" | "Standard" | "Deluxe" | "null") => {
        const roomTypeValue = roomType === "null" ? null : roomType;
        setSelectedRoomType(roomTypeValue);
        if (onRoomTypeChange) {
            onRoomTypeChange(roomTypeValue);
        }
    };
    return (
        <div className="w-full lg:w-96 h-64 lg:h-full bg-background border-b lg:border-b-0 lg:border-r flex flex-col">
      <div className="p-3 md:p-4 border-b">
        <h2 className="text-lg md:text-xl font-bold">รายการจอง</h2>
      </div>

      {/* Room Type Filter */}
      {/* <div className="p-3 md:p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">ประเภทห้อง:</span>
        </div>
        <Select value={selectedRoomType || "null"} onValueChange={handleRoomTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="เลือกประเภทห้อง" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(HOTEL_ROOM_TYPES).map(([key, roomType]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: roomType.color }}
                  />
                  <span>{roomType.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRoomType && HOTEL_ROOM_TYPES[selectedRoomType as keyof typeof HOTEL_ROOM_TYPES] && (
          <p className="text-xs text-muted-foreground mt-2">
            {HOTEL_ROOM_TYPES[selectedRoomType as keyof typeof HOTEL_ROOM_TYPES].description}
          </p>
        )}
      </div> */}

      <ScrollArea className="flex-1">
        <div className="p-3 md:p-4 space-y-4">
          {/* Pending Bookings */}
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2">
              รอดำเนินการ ({pendingBookings.length})
            </h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {pendingBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md flex-shrink-0 w-72 lg:w-auto ${
                    selectedBooking?.id === booking.id ? "ring-2 ring-primary" : ""
                  } ${
                    // Map booking room type to selected room type for comparison
                    (() => {
                        const roomTypeMapping: Record<string, "Suite" | "Standard" | "Deluxe" | null> = {
                            "standard": "Standard",
                            "deluxe": "Deluxe",
                            "suite": "Suite",
                            "family": null
                        };
                        const mappedRoomType = roomTypeMapping[booking.roomType] || null;
                        return selectedRoomType === mappedRoomType ? "ring-2 ring-blue-400 bg-blue-50" : "";
                    })()
                  }`}
                  onClick={() => selectBooking(booking)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-sm md:text-base">{booking.guestName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{booking.guestPhone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs md:text-sm">
                      <Bed className="w-3 h-3" />
                      <span className="font-medium" style={{ color: ROOM_TYPES[booking.roomType].color }}>
                        {ROOM_TYPES[booking.roomType].name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(booking.checkInDate), "dd MMM", { locale: th })} -{" "}
                        {format(new Date(booking.checkOutDate), "dd MMM yyyy", { locale: th })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{booking.numberOfDays} คืน</span>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm text-muted-foreground">ยอดรวม</span>
                        <span className="font-bold text-primary text-sm md:text-base">
                          ฿{booking.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {booking.assignedRoomId && (
                      <div className="text-xs text-muted-foreground">
                        ห้อง: {booking.assignedRoomId.replace("room-", "")}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Checked In Bookings */}
          {checkedInBookings.length > 0 && (
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2">
                เช็คอินแล้ว ({checkedInBookings.length})
              </h3>
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {checkedInBookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 flex-shrink-0 w-72 lg:w-auto"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-sm md:text-base">{booking.guestName}</span>
                        </div>
                        <Badge variant="default" className="bg-green-600 text-xs">
                          เข้าพักแล้ว
                        </Badge>
                      </div>

                      {booking.assignedRoomId && (
                        <div className="text-xs md:text-sm font-medium">
                          ห้อง: {booking.assignedRoomId.replace("room-", "")}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>ถึง {format(new Date(booking.checkOutDate), "dd MMM yyyy", { locale: th })}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
    )
}
