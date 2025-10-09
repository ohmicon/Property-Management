'use client'

import PropertyLayout from "../app/property-layout/page"
import { useSearchParams } from 'next/navigation';

interface HomePageProps {
  params: { id: string }; // Type the `id` parameter as a string
  searchParams: { [key: string]: string | string[] | undefined }; // Search params are optional
}

const types = ['market', 'hotel']
export default function HomePage() {
  const searchParams = useSearchParams();

  // ใส่ Default
  const typeBusiness = searchParams.get('type') || 'market';
  const projectId = searchParams.get('') || 'M004'
  if (typeof typeBusiness === 'string' && types.includes(typeBusiness)) {
    return <PropertyLayout typeBusiness={typeBusiness} projectId={projectId}/>
  }
  return <></>
}