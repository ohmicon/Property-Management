import { IResponse } from "@/services/external/models/master";
import { UnitMatrix } from "@/services/external/models/unit-matrix";
import { getUnitMatrixService } from "@/services/external/test-rental/get-unit-matrix";

export interface IPayloadGetUnitMatrixController {
  project_id: string;
  unit_id: string | null;
  year: number;
  month: number;
  day: number;
}

export interface IResponseGetUnitMatrixController {
  type: string;
  unit_id: string;
  unit_number: string;
  status: number;
  status_desc: string;
  x: number;
  y: number;
  m_price: number;
  m_price_desc: string;
}
export const getUnitMatrixController = async (payload: IPayloadGetUnitMatrixController): Promise<IResponse<IResponseGetUnitMatrixController[]>> => {
  try{
    const unitMatrix = await getUnitMatrixService({
      project_id: payload.project_id,
      year: payload.year,
      month: payload.month,
      day: payload.day
    });

    const responseData = unitMatrix.data?.map((item: UnitMatrix) => {
      const type = payload.day > 0 ? "daily" : "monthly";
      let status_desc = ""
      if (type === "daily") {
        if (item.UnitStatus === 0) {
          status_desc = "Available"
        }
        else if (item.UnitStatus === -1) {
          status_desc = "Unavailable"
        } else if (item.UnitStatus === 2) {
          status_desc = "Booked"
        }
      }
      else{
        if (item.UnitStatus === -1) {
          status_desc = "UnitStatus"
        }
        else if (item.UnitStatus === 0) {
          status_desc = "Available"
        }
        else if (item.UnitStatus === 1) {
          status_desc = "Some Available"
        }
        else if (item.UnitStatus === 2) {
          status_desc = "Booked"
        }
      }
      return {
        type: type,
        unit_id: item.UnitID,
        unit_number: item.UnitNumber,
        status: item.UnitStatus,
        status_desc: status_desc,
        x: item.X,
        y: item.Y,
        m_price: item.M_Price,
        m_price_desc: "",
      } as IResponseGetUnitMatrixController
    }) || [];

    return {
      success: true,
      data: responseData,
      message: "Success"
    }
  }
  catch (err: any) {
    return {
      success: false,
      data: [],
      error: err.message,
      message: err.message
    }
  }
};