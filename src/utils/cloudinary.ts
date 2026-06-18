import { getCloudinarySignature } from "@/app/actions/upload";

export async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const { cloudName, apiKey, timestamp, signature } = await getCloudinarySignature(folder);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);

  const resourceType = file.type.startsWith("image/") ? "image" : "raw";

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "업로드 실패");

  return data.secure_url as string;
}
