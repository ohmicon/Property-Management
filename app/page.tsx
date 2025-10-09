"use client"

import { useEffect, useState } from 'react';
import PropertyLayout from "../app/property-layout/page"

// interface HomePageProps {
//   params: { id: string }; // Type the `id` parameter as a string
//   searchParams: Promise<{ 
//     p: string;
//     type: string;
//   }>; // Search params are optional
// }

const types = ['market', 'hotel']
export default function HomePage() {
  // ใส่ Default
  // const typeBusiness = (await searchParams).type || 'market';
  // const typeBusiness = 'market'
  // const projectId = (await searchParams).p || 'M004'
  // const projectId = 'M004'
  const [typeBusiness, setTypeBusiness] = useState<string | null>()
  const [projectId, setProjectId] = useState<string | null>()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectTypeBusiness = params.get('type');
    const selectProject = params.get('p')
    setTypeBusiness(selectTypeBusiness || 'market')
    setProjectId(selectProject || 'M004')
  }, [])

  if (typeof typeBusiness === 'string' && types.includes(typeBusiness) && projectId) {
    return <PropertyLayout typeBusiness={typeBusiness} projectId={projectId}/>
  }

  
  return <></>
}