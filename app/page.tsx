import PropertyLayout from "../app/property-layout/page"

interface HomePageProps {
  params: { id: string }; // Type the `id` parameter as a string
  searchParams: Promise<{ 
    p: string;
    type: string;
  }>; // Search params are optional
}

const types = ['market', 'hotel']
export default async function HomePage({ searchParams }: HomePageProps) {

  // ใส่ Default
  const typeBusiness = (await searchParams).type || 'market';
  const projectId = (await searchParams).p || 'M004'
  if (typeof typeBusiness === 'string' && types.includes(typeBusiness)) {
    return <PropertyLayout typeBusiness={typeBusiness} projectId={projectId}/>
  }
  return <></>
}

export async function generateStaticParams() {
  return [
    { p: 'M004', type: 'market' },
    { id: '2', type: 'market' },
    { id: '3', type: 'market' },
  ];
}