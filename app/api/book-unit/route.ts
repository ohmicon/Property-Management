import { bookUnitController } from "@/controllers/book-unit";

export async function POST(request: Request) {
  try{
    const body = await request.json();
    const payload = body.payload;
    if (!payload) {
      return {
        success: false,
        error: 'Missing required parameters payload',
        data: false,
        message: 'Missing required parameters payload'
      }
    }
    const response = await bookUnitController(payload);
    return response;
  }
  catch(err: any){
    return {
      success: false,
      error: err.message,
      data: false,
      message: err.message
    }
  }
}