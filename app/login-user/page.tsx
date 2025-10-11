"use client"

import Spinner from "@/components/ui/Spinner"
import { loginUser } from "@/lib/api/auth-client";
import { useEffect } from "react"

export default function LoginUserPage() {

  const login = async () => {
    const params = new URLSearchParams(window.location.search);
    const user_id = params.get('u');
    const username = params.get('username');
    const projectId = params.get('p');

    if (user_id && username) {
      const resultLogin = await loginUser({ user_id, username });
      if (resultLogin.success) {
        window.location.href = '/' + (projectId ? `?p=${projectId}` : '');
      } else {
        alert('Login failed: ' + resultLogin.message);
      }
    }
  }

  useEffect(() => {
    login()
  }, [])

  return (
    <Spinner loading={true}>
      <div style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px", fontWeight: "bold" }}>
        กำลังเข้าสู่ระบบ...
      </div>
    </Spinner>
  )
}