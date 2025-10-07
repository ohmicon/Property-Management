import { bookUnitsService } from "@/services/external/test-rental/book-unit";

interface IPayloadBookUnit {
  customer_id: string;
  booking_date: string;
  booking_type: string;
  booking_month: number;
  booking_year: number;
  project_id: string;
  amount: number;
  daily_booking_units: {
    unit_id: string;
    book_date: string;
    amount: number;
  }[];
}

export const bookUnitController = async (payload: IPayloadBookUnit) => {
  try{
    payload.booking_type = payload.booking_type.toLocaleLowerCase() === 'monthly' ? 'Monthly' : 'Daily';
    const result = await bookUnitsService(payload);
    if (!result.data) {
      return {
        success: false,
        error: 'ไม่สามารถบันทึกการจองได้',
        data: null,
        message: 'ไม่สามารถบันทึกการจองได้'
      }
    }
    return result;
  }
  catch(err:any){
    return {
      success: false,
      error: err.message,
      data: null,
      message: err.message
    }
  }
}