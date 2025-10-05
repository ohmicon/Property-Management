import { NextResponse } from "next/server";
import { getCustomerController } from "@/controllers/customer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = body.keyword;
    if (!keyword) {
      return NextResponse.json({
        message: "❌ Missing required parameters keyword",
        error: 'failed',
        data: [],
      }, { status: 400 });
    }
    const response = await getCustomerController(keyword);
    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching customer:', err);
    return NextResponse.json({
      message: "failed",
      error: 'failed',
      data: [],
    }, { status: 500 });
  }
}
