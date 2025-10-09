'use client'

import PropertyLayout from "@/app/property-layout/page";
import { useSearchParams } from "next/navigation";

const types = ['market', 'hotel']
export default function Home () {
  const searchParams = useSearchParams();
  const typeBusiness = searchParams.get('type') || 'market';
  const projectId = searchParams.get('p') || 'M004'
  if (typeof typeBusiness === 'string' && types.includes(typeBusiness)) {
    return <PropertyLayout typeBusiness={typeBusiness} projectId={projectId}/>
  }
  return <></>
}