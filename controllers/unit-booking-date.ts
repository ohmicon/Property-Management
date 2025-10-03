import { IResponse } from "@/services/external/models/master";
import { getUnitBookingDate } from "@/services/external/test-rental/get-unit-booking";

export interface IPayloadGetUnitBookingDateController {
  project_id: string;
  unit_id: string | null;
  year: number;
  month: number;
  day: number;
}

export interface IResponseGetUnitBookingDateController {
  unit_number: string;
  booking_date_list: {
    [key: string]: string
  }
}

export const getUnitBookingDateController = async (payload: IPayloadGetUnitBookingDateController): Promise<IResponse<IResponseGetUnitBookingDateController[]>> => {
  try{
    const unitBookingData = await getUnitBookingDate({
      project_id: payload.project_id,
      year: payload.year,
      month: payload.month,
      day: payload.day
    })
    const responseUnitBookingDateList = unitBookingData.data?.map((item: {[key: string]: string}) => {
      const unit_number = item['UnitNumber']
      delete item['UnitNumber']
      return {
        unit_number: unit_number,
        booking_date_list: item
      }
    }) || []
    return {
      success: true,
      data: responseUnitBookingDateList,
      message: unitBookingData.message || "Success",
    }
  }
  catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: [],
      message: error.message
    }
  }
}