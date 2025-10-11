import { loginExternalController } from "@/controllers/auth";
import { accessTokenOptions } from "@/lib/auth";
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
    const loginResult = await loginExternalController(payload);
    const response = NextResponse.json(loginResult, { status: loginResult.success ? 200 : 400 });
    response.cookies.set({
      ...accessTokenOptions,
      name: 'access_token',
      value: loginResult.data?.accessToken || '',
    })
    return response;
  }
  catch(err: any){
    return NextResponse.json({
      success: true,
      data: false,
      message: 'failed',
    }, { status: 500 } );
  }
}