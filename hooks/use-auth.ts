import { useUserStore } from "@/app/user-store";
import { getMe } from "@/lib/api/auth-client";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const { user, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const getUser = async () => {
    try{
      const userData = await getMe()
      return userData.data;
    }
    catch(err:any){
      return null;
    }
  }

  const onHandleSetUser = async () => {
    if (user) {
      return
    }
    setIsLoading(true);
    const userData = await getUser();
    setIsLoading(false);
    if (userData) {
      setUser(userData.data);
    }
    else {
      setUser(null);
    }
    return user;
  }

  useEffect(() => {
    onHandleSetUser();
  }, [])

  return {
    isLoading,
    getUser: onHandleSetUser
  };
}