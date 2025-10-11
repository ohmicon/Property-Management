import { getUnitMatrixHotelController } from "@/controllers/hotel/unit-matrix";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { project_id, floor } = body;
    if (typeof project_id !== 'string' || typeof floor !== 'number') {
      return NextResponse.json({
        message: "project_id and floor are required",
        error: 'failed',
      }, { status: 400 });
    }
    const result = await getUnitMatrixHotelController({
      project_id,
      floor: Number(floor)
    })
    return NextResponse.json(result, { status: 200 });
  }
  catch (err: any) {
    return NextResponse.json({
      message: "error",
      error: 'failed',
    }, { status: 500 });
  }
}