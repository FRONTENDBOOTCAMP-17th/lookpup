import { Suspense } from "react";
import PetsitterSearchClient from "./_components/PetsitterSearchClient";

export default function PetsittersPage() {
  return (
    <Suspense>
      <PetsitterSearchClient />
    </Suspense>
  );
}
