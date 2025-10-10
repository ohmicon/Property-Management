"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HotelLegendProps {
  showLegend: boolean
  setShowLegend: (show: boolean) => void
}

export default function HotelLegend({ showLegend, setShowLegend }: HotelLegendProps) {
  return (
    <div
      className={`absolute bottom-4 right-4 transition-all duration-300 ${showLegend ? "translate-x-0" : "translate-x-full"}`}
    >
      <Card className="w-80 shadow-lg border-gray-200 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base text-gray-800">สถานะห้องพัก</CardTitle>
            <p className="text-sm text-gray-500">Hotel Room Status Information</p>
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
                <span className="text-sm font-medium text-gray-800">ว่างทุกวัน</span>
                <p className="text-xs text-gray-500">Available</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
              <div className="w-5 h-5 bg-red-400 rounded-full border-2 border-red-500 shadow-sm"></div>
              <div>
                <span className="text-sm font-medium text-gray-800">จองแล้ว</span>
                <p className="text-xs text-gray-500">Booked</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-100 border border-orange-400 hover:bg-orange-200 transition-colors">
              <div className="w-5 h-5 bg-orange-500 rounded-full border-2 border-orange-500 shadow-sm"></div>
              <div>
                <span className="text-sm font-medium text-gray-800">กำลังจอง</span>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors">
              <div className="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-500 shadow-sm"></div>
              <div>
                <span className="text-sm font-medium text-gray-800">จองได้บางวัน</span>
                <p className="text-xs text-gray-500">Some available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}