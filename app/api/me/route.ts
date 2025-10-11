import { autherizeUser } from "@/controllers/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try{
    const userSession = await autherizeUser()
    return NextResponse.json(userSession, { status: 200 } );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch(error){
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: 'Failed to get user',
      data: null,
    })
  }
}