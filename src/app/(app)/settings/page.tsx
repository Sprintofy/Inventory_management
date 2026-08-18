"use client";

import * as React from "react";
import { Bell, Building2, Monitor, Moon, Package, Paintbrush, Save, Sun } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";
import type { Settings } from "@/store/app-store";

export default function SettingsPage() {
  const { state, updateSettings, user } = useApp();
  const [draft, setDraft] = React.useState<Settings>(state.settings);

  React.useEffect(() => setDraft(state.settings), [state.settings]);

  const set = (patch: Partial<Settings>) => setDraft((d) => ({ ...d, ...patch }));

  const save = () => {
    updateSettings(draft);
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Configure the organization, preferences and notifications."
        breadcrumb={[{ label: "Settings" }]}
        actions={<Button onClick={save}><Save className="size-4" /> Save Changes</Button>}
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-4" /> Organization</CardTitle>
              <CardDescription>Basic information about your organization.</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-2xl gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Organization Name</Label>
                <Input className="mt-1.5" value={draft.orgName} onChange={(e) => set({ orgName: e.target.value })} />
              </div>
              <div>
                <Label>Default Currency</Label>
                <Select value={draft.defaultCurrency} onValueChange={(v) => set({ defaultCurrency: v })}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹ INR — Indian Rupee</SelectItem>
                    <SelectItem value="USD">$ USD — US Dollar</SelectItem>
                    <SelectItem value="EUR">€ EUR — Euro</SelectItem>
                    <SelectItem value="GBP">£ GBP — British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={draft.timezone} onValueChange={(v) => set({ timezone: v })}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Package className="size-4" /> Inventory Defaults</CardTitle>
              <CardDescription>Defaults applied to new items and stock alerts.</CardDescription>
            </CardHeader>
            <CardContent className="grid max-w-2xl gap-5 sm:grid-cols-2">
              <div>
                <Label>Default Unit</Label>
                <Select value={draft.defaultUnit} onValueChange={(v) => set({ defaultUnit: v })}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["unit", "pcs", "box", "pack", "kg", "liter", "meter", "set"].map((u) => <SelectItem key={u} value={u} className="capitalize">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Default Reorder Level</Label>
                <Input className="mt-1.5" type="number" min={0} value={draft.defaultReorderLevel} onChange={(e) => set({ defaultReorderLevel: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input className="mt-1.5" type="number" min={0} value={draft.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: Number(e.target.value) })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Bell className="size-4" /> Notifications</CardTitle>
              <CardDescription>Choose which events trigger notifications.</CardDescription>
            </CardHeader>
            <CardContent className="max-w-xl space-y-5">
              {([
                ["notifyLowStock", "Low stock alerts", "Notify when an item falls below its reorder level."],
                ["notifyRequests", "New requests", "Notify when someone submits a stock request."],
                ["notifyTransfers", "Transfers", "Notify when a transfer is created, approved or completed."],
                ["notifyPOs", "Purchase orders", "Notify when a purchase order is created or received."],
              ] as const).map(([key, title, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-muted-foreground text-xs">{desc}</p>
                  </div>
                  <Switch checked={draft[key]} onCheckedChange={(v) => set({ [key]: v })} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div>
                  <p className="text-sm font-medium">Show notification bell</p>
                  <p className="text-muted-foreground text-xs">Display the notification bell in the header.</p>
                </div>
                <Switch checked={draft.showNotifications} onCheckedChange={(v) => set({ showNotifications: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Paintbrush className="size-4" /> Appearance</CardTitle>
              <CardDescription>Personalize how the app looks for you.</CardDescription>
            </CardHeader>
            <CardContent className="max-w-xl space-y-6">
              <div>
                <Label>Theme</Label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {([
                    ["light", Sun, "Light"],
                    ["dark", Moon, "Dark"],
                    ["system", Monitor, "System"],
                  ] as const).map(([value, Icon, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set({ theme: value })}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${draft.theme === value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/50"}`}
                    >
                      <Icon className="size-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div>
                  <p className="text-sm font-medium">Collapsed sidebar</p>
                  <p className="text-muted-foreground text-xs">Show the sidebar as a compact icon rail.</p>
                </div>
                <Switch checked={draft.sidebarCollapsed} onCheckedChange={(v) => set({ sidebarCollapsed: v })} />
              </div>
              <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.name}</span> ({user?.email}). Appearance preferences are stored in your profile.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}