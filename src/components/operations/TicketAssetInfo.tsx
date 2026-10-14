"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Cpu, Disc3, HardDrive, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/store/app-store";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types";
import type { TicketAsset } from "@/types";

const warrantyVariant: Record<string, string> = {
  "Active": "text-success",
  "Expiring Soon": "text-warning",
  "Expired": "text-danger",
};

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-b pb-1.5">
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="mt-0.5 text-xs font-medium">{value || "—"}</p>
    </div>
  );
}

export function TicketAssetInfo({ ticketAsset, currentTicketId }: { ticketAsset: TicketAsset; currentTicketId: string }) {
  const { state } = useApp();
  const [open, setOpen] = React.useState(false);

  const asset: Asset | undefined = state.assets.find((a) => a.assetId === ticketAsset.assetId);
  const previousTickets = React.useMemo(() => {
    if (!asset) return [];
    return state.tickets
      .filter((t) => t.id !== currentTicketId && t.assets.some((a) => a.assetId === asset.assetId))
      .slice(0, 5);
  }, [state.tickets, asset, currentTicketId]);

  if (!asset) return null;

  return (
    <div className="rounded-lg border">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 p-3 text-left" aria-expanded={open}>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <HardDrive className="text-primary size-4" /> Asset Information
          <span className="bg-muted text-muted-foreground ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium">Read Only</span>
        </span>
        <ChevronDown className={cn("text-muted-foreground size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t p-4">
          <div>
            <h6 className="mb-2 text-xs font-semibold uppercase tracking-wide">Overview</h6>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Asset ID" value={`${asset.assetId} (${asset.id})`} />
              <Field label="Name" value={asset.name} />
              <Field label="Serial Number" value={ticketAsset.serialNumber ?? asset.serialNumber} />
              <Field label="Category" value={asset.category} />
              <Field label="Assigned To" value={asset.assignedTo ?? "Unassigned"} />
              <Field label="Department" value={asset.department} />
              <Field label="Purchase Date" value={formatDate(asset.purchaseDate)} />
            </div>
          </div>

          {asset.hardware && (
            <div>
              <h6 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"><Cpu className="size-3.5" /> Hardware</h6>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="CPU" value={asset.hardware.cpu} />
                <Field label="RAM" value={asset.hardware.ram} />
                <Field label="Storage" value={asset.hardware.storage} />
                <Field label="GPU" value={asset.hardware.gpu} />
                <Field label="Display" value={asset.hardware.display} />
                <Field label="Battery" value={asset.hardware.battery} />
                <Field label="Network" value={asset.hardware.network} />
              </div>
            </div>
          )}

          {asset.software && asset.software.length > 0 && (
            <div>
              <h6 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"><Disc3 className="size-3.5" /> Software</h6>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {asset.software.map((s) => (
                  <div key={s.name} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{s.name}</p>
                      <p className="text-muted-foreground text-[11px]">Version: {s.version}</p>
                    </div>
                    <StatusBadge status={s.licenseStatus === "Licensed" ? "active" : "inactive"} dot={false} className="shrink-0 text-[11px]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {asset.warrantyDetails && (
            <div>
              <h6 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"><ShieldCheck className="size-3.5" /> Warranty</h6>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Provider" value={asset.warrantyDetails.provider} />
                <div className="border-b pb-1.5">
                  <p className="text-muted-foreground text-[11px]">Status</p>
                  <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs font-medium", warrantyVariant[asset.warrantyDetails.status] ?? "")}>
                    <span className="size-1.5 rounded-full bg-current" /> {asset.warrantyDetails.status}
                  </p>
                </div>
                <Field label="Start Date" value={formatDate(asset.warrantyDetails.startDate)} />
                <Field label="Expiry Date" value={formatDate(asset.warrantyDetails.expiryDate)} />
              </div>
            </div>
          )}

          {previousTickets.length > 0 && (
            <div>
              <h6 className="mb-2 text-xs font-semibold uppercase tracking-wide">Previous Tickets for this Asset</h6>
              <div className="space-y-2">
                {previousTickets.map((t) => (
                  <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-muted-foreground">{t.id}</p>
                      <p className="truncate text-xs font-medium">{t.title}</p>
                    </div>
                    <StatusBadge status={t.status} className="shrink-0 text-[11px]" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
