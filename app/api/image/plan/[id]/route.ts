import axios from "axios"
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try{
    const { id: fileId } = await params
    const endpoint = `${process.env.RENTAL_SMARTSALE_API_ENDPOINT}/getimage?fileId=${fileId}`
    const streamRes = await axios.get(endpoint, {
      responseType: 'stream',
    })
    const nodeStream = streamRes.data as NodeJS.ReadableStream;
    const readableStream = new ReadableStream<Uint8Array>({
      start(controller) {
        nodeStream.on('data', chunk => controller.enqueue(Buffer.from(chunk)));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', err => controller.error(err));
      }
    });

    const nextResponse = new NextResponse(readableStream, {
      headers: {
        'Content-Type': streamRes.headers['content-type'] || 'image/png', // Use the content type from the response or fallback
        'Content-Disposition': 'inline; filename="downloaded-file.jpg"' // Set filename if needed
      },
    });

    return nextResponse;
  }
  catch(err){
    return Response.json(err)
  }
}