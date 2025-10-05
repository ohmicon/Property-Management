import { bookUnitsService } from "@/services/external/test-rental/book-unit";

interface IPayloadBookUnit {
  customer_id: string;
  booking_date: string;
  booking_type: string;
  booking_month: number;
  booking_year: number;
  amount: number;
  daily_booking_units: {
    unit_id: string;
    book_date: string;
    amount: number;
  }[];
}

export const bookUnitController = async (payload: IPayloadBookUnit) => {
  try{
    const result = await bookUnitsService(payload);
    if (!result.data) {
      throw new Error(result.message);
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