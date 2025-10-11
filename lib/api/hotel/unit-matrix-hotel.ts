import { ApiResponse, axiosPublic } from "@/lib/axios";

export interface UnitMatrixHotel{
  unit_id: string;
  unit_number: string;
  status: number;
  x: number | null;
  y: number | null;
  d_price: number;
  room_type: string;
  status_desc: string;
  booking: {
    customer_id: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
}

export interface IPayloadGetUnitHotel {
  project_id: string;
  floor: number;
}

export const getUnitMatrixHotelApi = async (): Promise<ApiResponse<boolean>> => {
  try{
    const response = await axiosPublic('/api/hotel/units-matrix');
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching unit matrix hotel:', error);
    throw error;
  }
}