import { getConnection } from "@/lib/db";
import { IResponse } from "../models/master";
import { UnitMatrix } from "../models/unit-matrix";
import sql from "mssql";

export interface IPayloadGetUnitMatrixService {
  project_id: string
  year: number
  month: number,
  day: number
}
export const getUnitMatrixService = async ({ project_id, year, month, day }: IPayloadGetUnitMatrixService): Promise<IResponse<UnitMatrix[]>> => {
  try{
    const pool = await getConnection();
    let result = await pool.request()
      .input("ProjectID", sql.NVarChar, project_id)
      .input("UnitID", sql.NVarChar, "")
      .input("Year", sql.Int, year)
      .input("Month", sql.Int, month)
      .input("Day", sql.Int, day)
      .execute(`SP_DAILY_MATRIX`);

    // mock price

    const newResult = result.recordset.map(item => {
      if (!item.M_Price || item.M_Price === 0) {
        item.M_Price = 200;
      }
      if (!item.D_Price || item.D_Price === 0) {
        item.D_Price = 250;
      }
      return item;
    })

    return {
      success: true,
      data: newResult,
      message: "Success"
    }
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: err.message
    }
  }
}