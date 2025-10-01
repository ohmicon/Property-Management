import type { NextApiRequest, NextApiResponse } from "next";
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT GETDATE() as now"); // query ง่าย ๆ

    return NextResponse.json({
      message: "✅ Database connected successfully!",
      serverTime: result.recordset[0].now,
    }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Database connection error:", err);
    return NextResponse.json({
      message: "❌ Database connection error",
      error: err.message,
    }, { status: 500 });
  }
}