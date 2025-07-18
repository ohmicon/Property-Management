export interface Circle {
  x: number
  y: number
  r: number
  status: "available" | "booked" | "pending"
  id: string
}

export const mapCircles: Circle[] = [
  { x: 310, y: 60, r: 20, status: "available", id: "A01" },
  { x: 310, y: 175, r: 20, status: "available", id: "A02" },
  { x: 310, y: 290, r: 20, status: "available", id: "A03" },
  { x: 310, y: 400, r: 20, status: "available", id: "A04" },
  { x: 310, y: 515, r: 20, status: "available", id: "A05" },
  { x: 310, y: 626, r: 20, status: "available", id: "A06" },
]
