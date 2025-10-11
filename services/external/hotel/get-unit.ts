import { IResponse } from "../models/master";
import { UnitMatrixHotel } from "../models/unit-matrix";
import { units } from './mock/units'

export const getUnitsHotelService = async (payload: {
  project_id: string;
  floor: number;
}): Promise<IResponse<UnitMatrixHotel[]>> => {
  try{
    // fetch from mock data
    const unitsFiltered = units.filter(u => u.floor === payload.floor)
    return {
      success: true,
      data: unitsFiltered as unknown as UnitMatrixHotel[],
      message: "Success",
      error: ""
    }

  }
  catch (err) {
    return {
      success: false,
      error: (err as Error).message,
      data: [],
      message: (err as Error).message
    }
  }
}