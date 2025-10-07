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

export interface IPayloadBookUnit {
  customer_id: string;
  booking_date: string;
  booking_type: string;
  booking_month: number;
  booking_year: number;
  amount: number;
  project_id: string;
  daily_booking_units: {
    unit_id: string;
    book_date: string;
    amount: number;
  }[];
}

export async function bookUnitApi (payload: IPayloadBookUnit): Promise<ApiResponse<boolean>> {
  try{
    const response = await axiosPublic.post<ApiResponse<boolean>>('/api/book-unit', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    throw error;
  }
}