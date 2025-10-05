import { Circle } from "@/components/canvas-map";
import { ApiResponse, axiosPublic } from "../axios";

// ดึงข้อมูล circles ทั้งหมด
export async function getCircles(): Promise<Circle[]> {
  try {
    const response = await axiosPublic.get('/api/circles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<Circle[]> = await response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch circles');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching circles:', error);
    throw error;
  }
}

// อัปเดต circles ทั้งหมด
export async function updateCircles(circles: Circle[]): Promise<Circle[]> {
  try {
    const response = await axiosPublic('/api/circles', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ circles }),
    });

    const result: ApiResponse<Circle[]> = await response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update circles');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error updating circles:', error);
    throw error;
  }
}

// อัปเดต circle เดียว
export async function updateCircle(id: string, updates: Partial<Circle>): Promise<Circle> {
  try {
    const response = await axiosPublic('/api/circles', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ id, updates }),
    });

    const result: ApiResponse<Circle> = await response.data;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update circle');
    }

    return result.data!;
  } catch (error) {
    console.error('Error updating circle:', error);
    throw error;
  }
}

// อัปเดตสถานะ circle
export async function updateCircleStatus(id: string, status: 'available' | 'booked' | 'pending'): Promise<Circle> {
  return updateCircle(id, { status });
}
