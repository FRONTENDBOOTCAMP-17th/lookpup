import { Suspense } from "react";
import PetsitterSearchClient from "@/components/petsitters/PetsitterSearchClient";

export default function PetsittersPage() {
  return (
    <Suspense>
      <PetsitterSearchClient />
    </Suspense>
  );
}
