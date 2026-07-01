import { getMySitterProfile, getSitterServices } from "@/app/actions/sitters";
import SitterProfilePreviewClient from "@/components/myprofile/SitterProfilePreviewClient";

export default async function SitterProfilePreviewPage() {
  const profileResult = await getMySitterProfile();

  if (!("data" in profileResult) || !profileResult.data) {
    return <SitterProfilePreviewClient />;
  }

  const { data: services } = await getSitterServices(profileResult.data.id);
  const activeServices = services.filter((s) => s.is_active);

  return (
    <SitterProfilePreviewClient
      initialSitter={profileResult.data}
      initialServiceDetails={activeServices}
    />
  );
}
