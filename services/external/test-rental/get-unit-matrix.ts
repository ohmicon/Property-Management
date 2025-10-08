import { getConnection } from "@/lib/db";
import { IResponse } from "../models/master";
import { FloorPlan, UnitMatrix } from "../models/unit-matrix";
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

export interface IPayloadGetFloorPlanService {
  project_id: string
}

export const getFloorPlanService = async ({ project_id }: IPayloadGetFloorPlanService): Promise<IResponse<FloorPlan[]>> => {
  try{
    const pool = await getConnection();
    const request = pool.request()
    if (project_id) {
      request.input("ProjectID", sql.NVarChar, project_id)
    }
    const { recordset: result } = await request.query(`
      SELECT P1.ProjectID, P1.FloorPlanName, P1.X, P1.Y, P2.FloorPlanPath
      FROM Sys_Daily_Floor_Plan P1
      INNER JOIN Sys_Daily_Floor_Plan P2 ON P2.FloorPlanID = P1.ParentID
      WHERE P1.ParentID <> 0 ${project_id ? 'AND P1.ProjectID = @ProjectID' : ''}
    `)
    return {
      success: true,
      data: result,
      message: "Success"
    }
  }
  catch (err: any) {
    console.log(err);
    return {
      success: false,
      error: 'failed',
      data: [],
      message: 'failed'
    }
  }
}