import { IResponse } from "@/services/external/models/master";

export interface IPayloadGetZonesByProjectController {
  project_id: string;
}

export interface IResponseGetZonesByProjectController {
  zone_id: string;
  zone_name: string;
  zone_path_image: string;
}

export const getZonesByProjectController = async (payload: IPayloadGetZonesByProjectController): Promise<IResponse<IResponseGetZonesByProjectController[]>> => {
  try {
    // mock data
    const response = [
      {
        zone_id: "1",
        zone_name: "Zone ตลาด 1",
        zone_path_image: `${process.env.NEXT_PUBLIC_SERVER_HOST}/NumberOneNightMarketZoneA.jpg`,
      }
    ]
    return {
      success: true,
      data: response,
      message: "Success"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: [],
      message: error.message
    };
  }
};