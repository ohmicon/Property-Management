"use client"

import { ScrollArea } from "./ui/scroll-area"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { User, Phone, Bed, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { pendingBookings, checkedInBookings, ROOM_TYPES, PendingBooking } from "@/data/booking-mock-data"
import { useState } from "react"

export default function CustomerBookingCard({
}) {
    const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null);
    
    const selectBooking = (booking: PendingBooking) => {
        setSelectedBooking(booking);
    };
    return (
        <div className="w-full lg:w-96 h-64 lg:h-full bg-background border-b lg:border-b-0 lg:border-r flex flex-col">
      <div className="p-3 md:p-4 border-b">
        <h2 className="text-lg md:text-xl font-bold">รายการจอง</h2>
      </div>

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
