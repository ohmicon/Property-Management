import { ICustomer } from "@/services/external/models/customer";
import { IResponse } from "@/services/external/models/master";
import { getCustomerRental } from "@/services/external/test-rental/get-customer";

export const getCustomerController = async (keyword: string): Promise<IResponse<ICustomer[]>> => {
  try {
    const response = await getCustomerRental(keyword);
    return {
      success: true,
      data: response.data as ICustomer[],
      message: "Success"
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      data: [],
      message: err.message
    }
  }
}

