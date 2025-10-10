// Room types configuration (referenced in the component)
export const ROOM_TYPES = {
  standard: {
    name: "Standard",
    color: "#3b82f6" // blue-500
  },
  deluxe: {
    name: "Deluxe",
    color: "#10b981" // green-500
  },
  suite: {
    name: "Suite",
    color: "#f59e0b" // amber-500
  },
  family: {
    name: "ห้องครอบครัว",
    color: "#8b5cf6" // violet-500
  }
};

// Hotel room types for selection
export const HOTEL_ROOM_TYPES = {
  "Suite": {
    id: "suite",
    name: "Suite",
    color: "#f59e0b", // amber-500
    description: "ห้องสวีทพร้อมห้องนั่งเล่น"
  },
  "Standard": {
    id: "standard",
    name: "Standard",
    color: "#3b82f6", // blue-500
    description: "ห้องสแตนดาร์ดขนาดพอเหมาะ"
  },
  "Deluxe": {
    id: "deluxe",
    name: "Deluxe",
    color: "#10b981", // green-500
    description: "ห้องดีลักซ์ขนาดใหญ่"
  },
  "null": {
    id: null,
    name: "ทั้งหมด",
    color: "#6b7280", // gray-500
    description: "แสดงทุกประเภทห้อง"
  }
};

// Booking interfaces
export interface PendingBooking {
  id: string;
  guestName: string;
  guestPhone: string;
  roomType: keyof typeof ROOM_TYPES;
  checkInDate: string;
  checkOutDate: string;
  numberOfDays: number;
  totalAmount: number;
  status: "confirmed" | "pending";
  assignedRoomId?: string;
}

export interface CheckedInBooking {
  id: string;
  guestName: string;
  assignedRoomId: string;
  checkOutDate: string;
}

// Mock data for pending bookings
export const pendingBookings: PendingBooking[] = [
  {
    id: "booking-001",
    guestName: "สมชาย ใจดี",
    guestPhone: "0812345678",
    roomType: "standard",
    checkInDate: "2025-10-10",
    checkOutDate: "2025-10-12",
    numberOfDays: 2,
    totalAmount: 2400,
    status: "confirmed",
    assignedRoomId: "room-101"
  },
  {
    id: "booking-002",
    guestName: "มานี รักสุข",
    guestPhone: "0823456789",
    roomType: "deluxe",
    checkInDate: "2025-10-11",
    checkOutDate: "2025-10-15",
    numberOfDays: 4,
    totalAmount: 6800,
    status: "pending",
    assignedRoomId: undefined
  },
  {
    id: "booking-003",
    guestName: "วีระชัย กำลังมั่น",
    guestPhone: "0834567890",
    roomType: "suite",
    checkInDate: "2025-10-12",
    checkOutDate: "2025-10-14",
    numberOfDays: 2,
    totalAmount: 4200,
    status: "confirmed",
    assignedRoomId: "room-201"
  },
  {
    id: "booking-004",
    guestName: "สุภาพร สุขใจ",
    guestPhone: "0845678901",
    roomType: "family",
    checkInDate: "2025-10-13",
    checkOutDate: "2025-10-16",
    numberOfDays: 3,
    totalAmount: 5400,
    status: "pending",
    assignedRoomId: undefined
  },
  {
    id: "booking-005",
    guestName: "ประเสริฐ จิตต์ดี",
    guestPhone: "0856789012",
    roomType: "standard",
    checkInDate: "2025-10-14",
    checkOutDate: "2025-10-17",
    numberOfDays: 3,
    totalAmount: 3600,
    status: "confirmed",
    assignedRoomId: "room-102"
  }
];

// Mock data for checked-in bookings
export const checkedInBookings: CheckedInBooking[] = [
  {
    id: "checkedin-001",
    guestName: "นายสมศักดิ์ รัตนา",
    assignedRoomId: "room-301",
    checkOutDate: "2025-10-11"
  },
  {
    id: "checkedin-002",
    guestName: "นางสาวสมหญิง ใจดี",
    assignedRoomId: "room-302",
    checkOutDate: "2025-10-12"
  },
  {
    id: "checkedin-003",
    guestName: "นายประยุทธ มั่นคง",
    assignedRoomId: "room-303",
    checkOutDate: "2025-10-13"
  }
];