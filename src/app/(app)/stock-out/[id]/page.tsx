"use client";

import * as React from "react";
import Link from "next/link";
import { PackageMinus, ArrowLeft, Clock, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatNumber } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { BackButton } from "@/components/ui/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";

export default function StockOutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: recordId } = React.use(params);

  const { state, stockOut } = useApp();

  const record = state.stockInRecords.find((r) => String(r.id) === recordId);

  const [remarks, setRemarks] = React.useState(record?.remarks ?? "");
  const [technicianName, setTechnicianName] = React.useState(record?.technicianName ?? "");
  const [secIcName, setSecIcName] = React.useState(record?.secIcName ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  if (!record) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Stock-in record not found.</p>
          <Button
            asChild
            variant="outline"
            onClick={() => {
              window.location.href = "/stock-in";
            }}
          >
            Back to Stock In
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error("Remarks are required before stocking out");
      return;
    }
    setSubmitting(true);
    try {
      await stockOut(recordId, remarks.trim(), technicianName.trim(), secIcName.trim());
      setSubmitted(true);
      toast.success("Stock issued successfully");
    } catch {
      // toast handled by store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Out"
        description={`Issue stock for ${record.itemName}`}
        breadcrumb={[
          { label: "Stock In", href: "/stock-in" },
          { label: "Stock Out" },
        ]}
        actions={
          <>
            <Link href="/stock-in">
              <Button variant="outline">
                <ArrowLeft className="size-4 mr-2" /> Back to Stock In
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Work Order Id</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-mono font-semibold">{record.workOrderId}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Job No</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-mono font-semibold">{record.jobNo}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Item</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-semibold">{record.itemName}</p>
            <p className="text-xs text-muted-foreground">
              Type {record.productType}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Quantity</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(record.quantity)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Date In</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-semibold">{formatDate(record.dateIn)}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Department</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-semibold">{record.department}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Defect</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-semibold">
              {record.defect ?? "-"}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Status</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <span className="text-sm font-medium">
              {record.status === "Stock Out" ? "Stock Out" : "Pending"}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issue Stock</CardTitle>
          <CardDescription>
            Enter remarks and details for this stock-out. The date out will be
            recorded automatically on submit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Remarks</Label>
              <Textarea
                placeholder="Reason for issuing this stock…"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Technician Name</Label>
              <Input
                placeholder="Technician name"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name of Sec I/c</Label>
              <Input
                placeholder="Name of Section In-charge"
                value={secIcName}
                onChange={(e) => setSecIcName(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || submitted || !remarks.trim() || !technicianName.trim() || !secIcName.trim()}
              className="bg-success hover:bg-success/90 text-white w-full"
            >
              {submitted ? (
                <><CheckCircle2 className="size-4 mr-2" /> Stocked Out</>
              ) : submitting ? (
                <><PackageMinus className="size-4 mr-2" /> Issuing…</>
              ) : (
                <><PackageMinus className="size-4 mr-2" /> Submit Stock Out</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {submitted && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Out Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Work Order Id</Label>
                <p className="text-sm font-mono">{record.workOrderId}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Job No</Label>
                <p className="text-sm font-mono">{record.jobNo}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Item</Label>
                <p className="text-sm">{record.itemName}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Quantity</Label>
                <p className="text-sm tabular-nums">{formatNumber(record.quantity)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date Out</Label>
                <p className="text-sm font-mono">{formatDate(new Date().toISOString())}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Technician Name</Label>
                <p className="text-sm">{technicianName}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name of Sec I/c</Label>
                <p className="text-sm">{secIcName}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Defect</Label>
                <p className="text-sm">{record.defect ?? "-"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Resolve Remarks</Label>
                <p className="text-sm">{remarks}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <p className="text-sm font-semibold text-destructive">Stock Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
