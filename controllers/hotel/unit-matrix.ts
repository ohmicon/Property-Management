import { getUnitsHotelService } from "@/services/external/hotel/get-unit"
import { IResponse } from "@/services/external/models/master"
import { UnitMatrixHotel } from "@/services/external/models/unit-matrix"

export interface IPayloadGetUnitMatrixHotelController {
  project_id: string;
  floor: number;
}

export const getUnitMatrixHotelController = async (payload: IPayloadGetUnitMatrixHotelController): Promise<IResponse<UnitMatrixHotel[]>> => {
  try{
    const unitMatrix = await getUnitsHotelService(payload)
    return unitMatrix
  }
  catch (err: any) {
    return {
      success: false,
      data: [],
      error: err.message,
      message: err.message
    }
  }
}