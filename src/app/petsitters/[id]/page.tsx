import SitterDetailClient from "@/components/petsitters/SitterDetailClient";

export default async function PetsitterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SitterDetailClient sitterId={id} />;
}
