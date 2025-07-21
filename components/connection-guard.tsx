"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface ConnectionGuardProps {
  isLoading: boolean
  isConnected: boolean
  connectionError: string | null
  retryCount: number
  maxRetries: number
  children: React.ReactNode
}

export default function ConnectionGuard({
  isLoading,
  isConnected,
  connectionError,
  retryCount,
  maxRetries,
  children
}: ConnectionGuardProps) {
  const handleRefresh = () => {
    window.location.reload()
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-96 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Wifi className="w-12 h-12 text-blue-500 animate-pulse" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              กำลังเชื่อมต่อ...
            </h2>
            <p className="text-gray-600 text-sm">
              กรุณารอสักครู่ ระบบกำลังเชื่อมต่อกับเซิร์ฟเวอร์
            </p>
            {retryCount > 0 && (
              <p className="text-orange-600 text-xs mt-2">
                พยายามเชื่อมต่อครั้งที่ {retryCount}/{maxRetries}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state if connection failed
  if (connectionError && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="w-96 shadow-xl border-red-200">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <WifiOff className="w-12 h-12 text-red-500" />
                <AlertTriangle className="w-6 h-6 text-red-600 absolute -top-1 -right-1 bg-white rounded-full p-1" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-3">
              ไม่สามารถเชื่อมต่อได้
            </h2>
            <p className="text-red-700 text-sm mb-4 leading-relaxed">
              {connectionError}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-xs">
                <strong>หมายเหตุ:</strong> ระบบจองแบบ Real-time ต้องการการเชื่อมต่อกับเซิร์ฟเวอร์
                เพื่อให้สามารถซิงค์ข้อมูลกับผู้ใช้คนอื่นได้
              </p>
            </div>
            <Button 
              onClick={handleRefresh}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรชหน้าเว็บ
            </Button>
            <p className="text-gray-500 text-xs mt-3">
              หากปัญหายังคงอยู่ กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show disconnected state (if was connected before but lost connection)
  if (!isConnected && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
        <Card className="w-96 shadow-xl border-yellow-200">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <WifiOff className="w-12 h-12 text-yellow-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-3">
              การเชื่อมต่อขาดหาย
            </h2>
            <p className="text-yellow-700 text-sm mb-4">
              การเชื่อมต่อกับเซิร์ฟเวอร์ถูกตัด ระบบกำลังพยายามเชื่อมต่อใหม่...
            </p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรชหน้าเว็บ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success state briefly when connected
  if (isConnected) {
    return (
      <div className="relative">
        {children}
        {/* Connection status indicator */}
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-green-100 border border-green-300 rounded-full px-3 py-1 shadow-sm">
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-green-700 text-xs font-medium">เชื่อมต่อแล้ว</span>
          </div>
        </div>
      </div>
    )
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-96 shadow-xl">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            สถานะไม่ทราบ
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            ไม่สามารถระบุสถานะการเชื่อมต่อได้
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรชหน้าเว็บ
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
