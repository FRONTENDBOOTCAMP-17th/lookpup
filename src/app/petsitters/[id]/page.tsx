import SitterDetailClient from "@/components/petsitters/SitterDetailClient";

export default async function PetsitterProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; roomId?: string }>;
}) {
  const { id } = await params;
  const { from, roomId } = await searchParams;
  return <SitterDetailClient sitterId={id} from={from} roomId={roomId} />;
}
