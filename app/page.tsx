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
  const typeBusiness = searchParams.get('type');
  if (typeof typeBusiness === 'string' && types.includes(typeBusiness)) {
    return <PropertyLayout typeBusiness={typeBusiness}/>
  }
  return <></>
}