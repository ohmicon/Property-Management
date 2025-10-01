import { Circle } from "@/components/canvas-map";
import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

// Global socket instance to prevent multiple connections
let globalSocket: Socket | null = null;
let isInitializing = false;

export function useRealtimeBooking() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  useEffect(() => {
    // Function to initialize socket
    const initSocket = async () => {
      // Return existing global socket if available
      if (globalSocket && globalSocket.connected) {
        console.log('♻️ Reusing existing global socket:', globalSocket.id);
        setSocket(globalSocket);
        setIsConnected(true);
        setIsLoading(false);
        return;
      }

      // Prevent multiple simultaneous initializations
      if (isInitializing) {
        console.log('⏳ Socket initialization already in progress...');
        // Wait for existing initialization
        const checkInterval = setInterval(() => {
          if (globalSocket && globalSocket.connected) {
            setSocket(globalSocket);
            setIsConnected(true);
            setIsLoading(false);
            clearInterval(checkInterval);
          } else if (!isInitializing) {
            clearInterval(checkInterval);
            setIsLoading(false);
          }
        }, 100);
        return;
      }

      try {
        isInitializing = true;
        setIsLoading(true);
        console.log("🔧 Initializing socket connection...");
        
        // First, initialize the Socket.IO server
        const response = await fetch('/api/socket');
        if (!response.ok) {
          throw new Error(`Failed to initialize server: ${response.status}`);
        }
        
        const serverInfo = await response.json();
        console.log('📊 Server info:', serverInfo);
        
        // Connect to the Socket.IO server
        const socketUrl = `http://localhost:${serverInfo.port || 8080}`;
        // const socketUrl = `https://n05txbss-8080.asse.devtunnels.ms`;
        console.log(`🔌 Attempting to connect to: ${socketUrl}`);
        
        const newSocket = io(socketUrl, {
          transports: ['polling'],
          timeout: 10000,
          reconnectionAttempts: 2,
          reconnectionDelay: 2000,
          autoConnect: true,
          forceNew: false
        });
        
        // Store as global socket
        globalSocket = newSocket;
        setSocket(newSocket);
        
      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        isInitializing = false;
        setIsLoading(false);
        toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      }
    };

    // Initialize socket connection
    initSocket();

    // Cleanup function - DON'T disconnect global socket
    return () => {
      console.log("🧹 Component cleanup - keeping global socket alive");
      // Don't disconnect the global socket as other components might be using it
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Handle successful connection
    const onConnect = () => {
      console.log("✅ Socket connected successfully");
      setIsConnected(true);
      setIsLoading(false);
      setConnectionError(null);
      setRetryCount(0);
      toast.success("🔗 เชื่อมต่อแล้ว! กำลังโหลดสถานะปัจจุบัน...");
      
      // Request current booking state after connection
      setTimeout(() => {
        if (socket && socket.connected) {
          console.log('📡 Requesting current booking state...');
          socket.emit('requestCurrentState');
        }
      }, 500);
    };

    const onDisconnect = (reason: string) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - try to reconnect
        setConnectionError('เซิร์ฟเวอร์ตัดการเชื่อมต่อ');
      }
      toast.error(`การเชื่อมต่อถูกตัด: ${reason}`);
    };

    const onConnectError = (error: Error) => {
      console.error("❌ Socket connection error:", error);
      setIsLoading(false);
      
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (newRetryCount >= maxRetries) {
        setConnectionError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณา Refresh หน้าเว็บ');
        toast.error('เชื่อมต่อไม่สำเร็จ กรุณา Refresh หน้าเว็บ');
      } else {
        toast.error(`พยายามเชื่อมต่อ... (ครั้งที่ ${newRetryCount}/${maxRetries})`);
      }
    };

    // Handle test message acknowledgment
    const onTestMessageReceived = (acknowledgment: string) => {
      console.log("✅ Server acknowledgment:", acknowledgment);
      toast.success(`เซิร์ฟเวอร์ตอบกลับ: ${acknowledgment}`);
    };

    // Handle temporary bookings state from server
    const onTemporaryBookingsState = (bookings: Array<{ circleId: string; bookedBy: string; bookedAt: number }>) => {
      console.log('📦 Received current booking state from server:', bookings);
      
      if (bookings.length > 0) {
        console.log('🎯 Current active bookings:', bookings.map(b => `${b.circleId} (${b.bookedBy})`).join(', '));
        toast.info(`📍 พบการจองปัจจุบัน ${bookings.length} รายการ`);
      } else {
        console.log('✨ No active bookings found');
      }
      
      // Emit event for canvas-map to handle
      window.dispatchEvent(new CustomEvent('temporaryBookingsReceived', { detail: bookings }));
    };

    // Handle bookings released when clients disconnect
    const onBookingsReleased = (releasedCircles: Array<{ id: string; status: string; bookedBy?: string; bookedAt?: number }>) => {
      console.log('🔓 Received released bookings:', releasedCircles);
      // Emit event for canvas-map to handle
      window.dispatchEvent(new CustomEvent('bookingsReleased', { detail: releasedCircles }));
      toast.info(`🔓 มีการยกเลิกการจอง ${releasedCircles.length} รายการ`);
    };

    // Register event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("temporaryBookingsState", onTemporaryBookingsState);
    socket.on("bookingsReleased", onBookingsReleased);

    // Cleanup function
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("temporaryBookingsState", onTemporaryBookingsState);
      socket.off("bookingsReleased", onBookingsReleased);
    };
  }, [socket]);

  const onSelectBooking = (booking: Circle) => {
    if (!socket || !isConnected) {
      toast.error("ไม่สามารถอัพเดทได้ เนื่องจากขาดการเชื่อมต่อ");
      return;
    }

    socket.emit("selectBooking", booking);
    console.log("📋 Selected booking sent:", booking);
    toast.success("เลือกจองสำเร็จ");
  };

  const broadcastCircleUpdate = (circle: Circle) => {
    if (!socket || !isConnected) {
      console.log("❌ Cannot broadcast - not connected");
      return;
    }

    if (!socket.id) {
      console.log("❌ Cannot broadcast - socket ID is missing");
      return;
    }
    
    // Validate circle data
    if (!circle || !circle.id || !circle.status) {
      console.error("❌ Cannot broadcast - invalid circle data:", circle);
      return;
    }

    const data = {
      circle,
      sourceSocketId: socket.id
    };
    
    console.log("📡 About to broadcast with data:", {
      socketId: socket.id,
      connected: socket.connected,
      circleData: {
        id: circle.id,
        x: circle.x,
        y: circle.y,
        r: circle.r,
        status: circle.status,
        bookedBy: circle.bookedBy
      },
      data
    });
    
    socket.emit("selectBooking", data);
    console.log("✅ Broadcast sent successfully");
  };

  return {
    socket,
    isConnected,
    isLoading,
    connectionError,
    retryCount,
    maxRetries,

    onSelectBooking,
    broadcastCircleUpdate,
  };
}
