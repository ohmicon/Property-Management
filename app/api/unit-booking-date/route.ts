import { getUnitBookingDateController } from "@/controllers/unit-booking-date";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.project_id || !body.year || !body.month) {
      return NextResponse.json({
        message: "❌ Missing required parameters",
        error: 'failed',
      }, { status: 400 });
    }
    const unitBookingDate = await getUnitBookingDateController({ 
      project_id: body.project_id,
      unit_id: body.unit_id || null,
      year: body.year, 
      month: body.month,
      day: body.day || 0
    });
    return NextResponse.json(unitBookingDate, { status: 200 });
  }
  catch (err: any) {
    console.error("❌ Database connection error:", err);
    return NextResponse.json({
      message: "❌ Database connection error",
      error: 'failed',
    }, { status: 500 });
  }
}