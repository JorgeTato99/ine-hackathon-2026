import { Suspense } from "react";
import { Explorer, WorkspaceLoading } from "@/components/explorer/explorer";

export default function HomePage() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <Explorer />
    </Suspense>
  );
}
