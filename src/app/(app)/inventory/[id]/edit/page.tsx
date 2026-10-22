"use client";

import { use, useMemo } from "react";
import { InventoryForm } from "@/components/inventory/InventoryForm";
import { useApp } from "@/store/app-store";

export default function InventoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { state } = useApp();

  const item = state.inventory.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Item not found</h2>
          <p className="text-muted-foreground">This inventory item doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <InventoryForm open={true} onOpenChange={() => {}} item={item} fullPage />
  );
}
