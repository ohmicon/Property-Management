import { getConnection } from "@/lib/db"
import { IResponse } from "../models/master"
import sql from "mssql"

export interface IPayloadGetUnitBookingDateService {
  project_id: string
  year: number
  month: number,
  day: number
}

export const getUnitBookingDate = async ({ project_id, year, month, day }: IPayloadGetUnitBookingDateService): Promise<IResponse<Array<{[key: string]: string | number}>>> => {
  try{
    const pool = await getConnection();
    let result = await pool.request()
      .input("ProjectID", sql.NVarChar, project_id)
      .input("UnitID", sql.NVarChar, "")
      .input("Year", sql.Int, year)
      .input("Month", sql.Int, month)
      .input("Day", sql.Int, day)
      .execute<{[key: string]: string}>(`SP_DAILY_MATRIX_ONDAY`);

    return {
      success: true,
      data: result.recordset,
      message: "Success"
    }
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: 'Not found booking date'
    }
  }
}