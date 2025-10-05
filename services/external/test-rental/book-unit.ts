import { getConnection } from "@/lib/db";
import { IResponse } from "../models/master";
import sql from "mssql";
import dayjs from "dayjs";

interface IPayloadBookUnitsService {
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

export const bookUnitsService = async (payload: IPayloadBookUnitsService): Promise<IResponse<boolean>> => {
  const pool = await getConnection();
  let transaction = new sql.Transaction(pool);
  await transaction.begin();

  try{
    const bookingIdRunning = await getBookingIdRunning();
    if (!bookingIdRunning) {
      return {
        success: false,
        error: 'ไม่สามารถสร้างรหัสการจองได้',
        data: false,
        message: 'ไม่สามารถสร้างรหัสการจองได้'
      }
    }
    const bookingQuery = `
      INSERT INTO [dbo].[Sys_Daily_Booking]
      ([BookingID]
      ,[TransactionDate]
      ,[BookingType]
      ,[CustomerID]
      ,[DailyID]
      ,[Amount]
      ,[Status]
      ,[StatusDate]
      ,[PaidStatus]
      ,[PaidDate]
      ,[CreatedAt])
    OUTPUT INSERTED.BookingID
    VALUES
      (@BookingID
      ,GETDATE()
      ,@BookingType
      ,@CustomerID
      ,@DailyID
      ,@Amount
      ,'P'
      ,GETDATE()
      ,null
      ,null
      ,GETDATE())
    `
    const bookingResult = await transaction.request()
      .input("BookingType", sql.NVarChar, payload.booking_type)
      .input("CustomerID", sql.NVarChar, payload.customer_id)
      .input("DailyID", sql.NVarChar, dayjs().format("YYYYMMDD"))
      .input("Amount", sql.Decimal(18,2), payload.amount)
      .input("BookingID", sql.NVarChar, bookingIdRunning)
      .query<{ BookingID: string }>(bookingQuery);
    const bookingId = bookingResult.recordset[0].BookingID;

    const bookingUnitsRequest = transaction.request()
    const bookingUnitsQuery = `
      INSERT INTO [dbo].[Sys_Daily_Booking_Unit]
        ([BookingID]
        ,[UnitID]
        ,[BookingDate]
        ,[Amount]
        ,[CreatedAt]
        ,[Status])
      VALUES
        ${payload.daily_booking_units.map((unit, index) => {
          bookingUnitsRequest.input(`UnitID${index}`, sql.NVarChar, unit.unit_id);
          bookingUnitsRequest.input(`BookingDate${index}`, sql.NVarChar, unit.book_date);
          bookingUnitsRequest.input(`Amount${index}`, sql.Decimal(18,2), unit.amount);
          return `(@BookingID, @UnitID${index}, @BookingDate${index}, @Amount${index}, GETDATE(), 'P')`
        }).join(",")}
    `
    bookingUnitsRequest.input("BookingID", sql.NVarChar, bookingId);
    
    await bookingUnitsRequest.query(bookingUnitsQuery);

    await transaction.commit();
    return {
      success: true,
      data: true,
      message: "Success"
    }
  }
  catch(err:any){
    await transaction.rollback();
    return {
      success: false,
      error: err.message,
      data: false,
      message: err.message
    }
  }
}

export const getBookingIdRunning = async (): Promise<string | null> => {
  try{
    const prefix = `R-${dayjs().format("YYMMDD")}`;
    const pool = await getConnection();
    const result = await pool.request()
      .query<{ BookingID: string }>(`
        SELECT TOP 1 BookingID 
        FROM Sys_Daily_Booking
        WHERE BookingID LIKE '${prefix}%'
        ORDER BY BookingID DESC
      `);
    
    const bookingId = result.recordset[0]?.BookingID;
    // R-250717004 format R-YYMMDDXXX
    if (bookingId) {
      const prefix = "R-";
      const datePart = dayjs().format("YYMMDD");
      const serialPart = bookingId.slice(-3);
      const newSerial = String(Number(serialPart) + 1).padStart(3, '0');
      return `${prefix}${datePart}${newSerial}`;
    } else {
      return `R-${dayjs().format("YYMMDD")}001`;
    }
  }
  catch(err:any){
    return null;
  }
}