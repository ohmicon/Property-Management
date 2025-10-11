import { axiosPrivate } from "../axios";

export interface ILoginUserPayload {
  user_id: string;
  username: string;
}

export const loginUser = async (payload: ILoginUserPayload) => {
  try{
    const res = await axiosPrivate.post('/api/login-external', {
      user_id: payload.user_id,
      username: payload.username
    });

    return {
      success: true,
      data: res.data,
      message: 'Login successful'
    }
  }
  catch(err:any){
    return {
      success: false,
      error: err.message,
      data: null,
      message: 'Login failed'
    }
  }
}

export const getMe = async () => {
  try{
    const res = await axiosPrivate.get('/api/me');
    return {
      success: true,
      data: res.data,
      message: 'Fetch user successful'
    }
  }
  catch(err:any){
    return {
      success: false,
      error: err.message,
      data: null,
      message: 'Fetch user failed'
    }
  }
}