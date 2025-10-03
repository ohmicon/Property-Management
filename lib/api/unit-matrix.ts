import { ApiResponse, axiosPublic } from "../axios";


export interface UnitMatrix {
  type: string,
  unit_id: string,
  unit_number: string,
  status: number,
  status_desc: string,
  x: number,
  y: number,
  m_price: number,
  d_price: number
}
export async function getUnitMatrixApi (payload: {
  project_id: string,
  year: number,
  month: number,
  day: number
}) {
  try{
    const response = await axiosPublic.post<ApiResponse<UnitMatrix[]>>('/api/unit-matrix', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching circles:', error);
    throw error;
  }
}

export interface Zone {
  zone_id: string,
  zone_name: string,
  zone_path_image: string
}

export async function getZonesByProjectApi (payload: {
  project_id: string
}) {
  try{
    const response = await axiosPublic.post<ApiResponse<Zone[]>>('/api/zones-by-project', payload);
    return response.data
  }
  catch (error: any) {
    console.error('Error fetching zones:', error);
    throw error;
  }
}