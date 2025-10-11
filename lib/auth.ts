import { IUserSession } from '@/model/auth.model'
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'

interface ITokenOptions {
  expires: Date
  maxAge: number
  httpOnly: boolean
  sameSite: 'lax' | 'strict' | 'none' | undefined
  secure?: boolean
}

export interface IAccessTokenOptions {
  expiresIn: SignOptions["expiresIn"];
  payload: IUserSession
}

const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10)
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || '1200',
  10
)

export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000), //
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
}

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000), // วัน
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
}

export function signAccesstoken({ payload, expiresIn }: IAccessTokenOptions) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!, 
    { expiresIn: expiresIn }
  )
}

export function signRefreshToken(payload: {session_id: string; expiresIn: SignOptions["expiresIn"]}) {
  return jwt.sign(
      {
          session_id: payload.session_id
      },
      process.env.JWT_SECRET!,
      {
          expiresIn: payload.expiresIn
      }
  )
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as  JwtPayload
}

export function decodeToken(token: string) {
  return jwt.decode(token) as JwtPayload
}