"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function WorkspaceIndexPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/workspace/dashboard");
  }, [router]);

  return null;
}
