import { NextRequest } from 'next/server'
import socketServer from '@/lib/socket-server'

export async function GET(req: NextRequest) {
  return socketServer(req)
}

export async function POST(req: NextRequest) {
  return socketServer(req)
}

// Prevent Next.js from caching this route
export const dynamic = 'force-dynamic'
