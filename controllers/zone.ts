import { IResponse } from "@/services/external/models/master";
import { getFloorPlanService } from "@/services/external/test-rental/get-unit-matrix";

export interface IPayloadGetZonesByProjectController {
  project_id: string;
}

export interface IResponseGetZonesByProjectController {
  zone_id: string;
  zone_name: string;
  x: number;
  y: number;
  zone_path_image: string;
}

export const getZonesByProjectController = async (payload: IPayloadGetZonesByProjectController): Promise<IResponse<IResponseGetZonesByProjectController[]>> => {
  try {
    // mock data
    // const response = [
    //   {
    //     zone_id: "1",
    //     zone_name: "Zone ตลาด 1",
    //     zone_path_image: `${process.env.NEXT_PUBLIC_SERVER_HOST}/NumberOneNightMarketZoneA.jpg`,
    //   }
    // ]
    const zoneData = await getFloorPlanService(payload);
    const mappingData = zoneData.data?.map((item, index) => {
      return {
        zone_id: index+"",
        zone_name: item.FloorPlanName,
        x: item.X,
        y: item.Y,
        zone_path_image: `${process.env.NEXT_PUBLIC_SERVER_HOST}/NumberOneNightMarketZoneA.jpg`, // ต้องมาแก้นะ
      } as IResponseGetZonesByProjectController
    }) || [];
    return {
      success: true,
      data: mappingData,
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