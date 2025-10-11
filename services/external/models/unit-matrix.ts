export interface UnitMatrix {
  UnitID: string;
  UnitNumber: string;
  UnitStatus: number;
  X: number;
  Y: number;
  M_Price: number;
  D_Price: number;
}

export interface FloorPlan {
  ProjectID: string;
  FloorPlanName: string;
  X: number;
  Y: number;
  FloorPlanPath: string;
  FileID: string;
}

export interface UnitMatrixHotel{
  unit_id: string;
  unit_number: string;
  status: number;
  x: number | null;
  y: number | null;
  d_price: number;
  room_type: string;
  status_desc: string;
  floor: string;
  booking: {
    customer_id: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
}