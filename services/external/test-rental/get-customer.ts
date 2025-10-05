import axios from "axios"
import { ICustomer } from "../models/customer"
import { IResponse } from "../models/master"

export const getCustomerRental = async (keyword: string): Promise<IResponse<ICustomer[]>> => {
  try{
    const response = await axios({
      method: 'POST',
      url: `${process.env.RENTAL_API_ENDPOINT}/customer/contactloadall`,
      headers: {
        'Content-Type': 'application/json',
        'rem-api-usermane': process.env.REM_USERNAME || '',
        'rem-api-password': process.env.REM_PASSWORD || '',
        'rem-api-secretkey': process.env.REM_SECRET || ''
      },
      data: {
        "saleId": "429ca1b6-874e-4071-be63-8753ea7473f3",
        "buId": "001",
        "page": "1",
        "pageSize": "10",
        "search": {
          "id": "",
          "keyword": keyword,
          "type": ""
        },
        "sortBy": ""
      }
    })
    return {
      success: true,
      data: response.data.data?.contacts as ICustomer[],
      message: "Success"
    }
  }
  catch (err: any) {
    return {
      success: false,
      error: err.message,
    }
  }
}