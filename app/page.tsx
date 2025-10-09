import PropertyLayout from "../app/property-layout/page"

interface HomePageProps {
  params: { id: string }; // Type the `id` parameter as a string
  searchParams: { [key: string]: string | string[] | undefined }; // Search params are optional
}

const types = ['market', 'hotel']
export default async function HomePage({ searchParams }: HomePageProps) {

  // ใส่ Default
  const typeBusiness = ((await searchParams).type as string) || 'market';
  const projectId = ((await searchParams).project as string) || 'M004'
  if (typeof typeBusiness === 'string' && types.includes(typeBusiness)) {
    return <PropertyLayout typeBusiness={typeBusiness} projectId={projectId}/>
  }
  return <></>
}