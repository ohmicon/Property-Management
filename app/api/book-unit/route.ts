import { bookUnitController } from "@/controllers/book-unit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try{
    const payload = await request.json();
    if (!payload) {
      return {
        success: false,
        error: 'Missing required parameters payload',
        data: false,
        message: 'Missing required parameters payload'
      }
    }
    const response = await bookUnitController(payload);
    return NextResponse.json({
      success: true,
      data: response.data,
      message: response.message
    });
  }
  catch(err: any){
    return NextResponse.json({
      success: true,
      data: false,
      message: 'failed',
    }, { status: 500 } );
  }
}