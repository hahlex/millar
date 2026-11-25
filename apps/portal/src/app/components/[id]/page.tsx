import React from "react";
import registry from "@hahlex/millar-tokens/registry";
import { ComponentWorkbenchView } from "@/components/ComponentWorkbenchView";

export function generateStaticParams() {
  return registry.components.map((c) => ({ id: c.id }));
}

export default async function ComponentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComponentWorkbenchView id={id} />;
}
