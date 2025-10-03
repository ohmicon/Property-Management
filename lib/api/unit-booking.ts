import { ApiResponse, axiosPublic } from "../axios";

export interface UnitBookingDate {
  unit_number: string
  booking_date_list: {
    [key: string]: number
  }
}

export async function getUnitBookingDateApi (payload: {
  project_id: string,
  year: number,
  month: number,
  day: number
}): Promise<ApiResponse<UnitBookingDate[]>> {
  try{
    const response = await axiosPublic.post<ApiResponse<UnitBookingDate[]>>('/api/unit-booking-date', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    throw error;
  }
}