import { signAccesstoken, verifyToken } from "@/lib/auth";
import { IUserSession } from "@/model/auth.model";
import { IResponse } from "@/services/external/models/master";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export interface ILoginExternalPayload {
  username: string;
  user_id: string;
}

export const loginExternalController = async (payload: ILoginExternalPayload) => {
  try{
    const session_id = randomUUID();
    const signedAccessToken = signAccesstoken({
      payload: {
        session_id,
        username: payload.username,
        user_id: payload.user_id,
        id: payload.user_id
      },
      expiresIn: '24h'
    })
    return {
      success: true,
      data: { accessToken: signedAccessToken },
      message: 'Login successful'
    }
  }
  catch(err:any){
    return {
      success: false,
      error: err.message,
      data: null,
      message: 'Login failed'
    }
  }
}

export const autherizeUser = async (): Promise<IResponse<IUserSession | null>> => {
  try{
    // Verify token here if needed
    const access_token = (await cookies()).get('access_token')?.value
    const decoded = verifyToken(access_token || '');
    if (!decoded) {
      return {
        success: false,
        error: 'Invalid token',
        data: null,
        message: 'User is not authorized'
      }
    }
    const userSession: IUserSession = {
      session_id: decoded.session_id,
      username: decoded.username,
      user_id: decoded.user_id,
      id: decoded.id
    }
    return {
      success: true,
      data: userSession,
      message: 'User is authorized'
    }
  }
  catch(err:any){
    return {
      success: false,
      error: err.message,
      data: null,
      message: 'User is not authorized'
    }
  }
}