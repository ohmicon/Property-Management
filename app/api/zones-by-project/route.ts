import { getUnitMatrixController } from "@/controllers/unit-matrix";
import { getZonesByProjectController } from "@/controllers/zone";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.project_id) {
      return NextResponse.json({
        message: "❌ Missing required parameters project_id",
        error: 'failed',
      }, { status: 400 });
    }
    const response = await getZonesByProjectController({ project_id: body.project_id });
    return NextResponse.json(response, { status: 200 });
  }
  catch (err: any) {
    return NextResponse.json({
      message: "failed",
      error: 'failed',
    }, { status: 500 });
  }
}