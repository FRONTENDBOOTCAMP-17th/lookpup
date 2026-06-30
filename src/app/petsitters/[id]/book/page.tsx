import BookingClient from "./_components/BookingClient";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookingClient sitterId={id} />;
}
