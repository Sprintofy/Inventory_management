"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { FolderTree, MoreHorizontal, Pencil, Plus, Trash2, Box, Tag, Hash, Package, TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useApp } from "@/store/app-store";
import { useFakeLoading } from "@/hooks/use-fake-loading";
import { formatNumber, uid, cn } from "@/lib/utils";
import type { Category } from "@/types";
import { getIconBgClass, getCardGradient, CHART_PALETTE, getPageGradient } from "@/lib/theme";

const schema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().min(2, "Description is required"),
});
type SV = z.output<typeof schema>;

export default function CategoriesPage() {
  const { state, addCategory, updateCategory, deleteCategory, can } = useApp();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [deleting, setDeleting] = React.useState<Category | null>(null);
  const loading = useFakeLoading();

  const form = useForm<SV>({
    resolver: zodResolver(schema) as unknown as Resolver<SV>,
    defaultValues: { name: "", description: "" },
  });

  React.useEffect(() => {
    if (dialogOpen) form.reset(editing ? { name: editing.name, description: editing.description } : { name: "", description: "" });
  }, [dialogOpen, editing, form]);

  const categories = state.categories;

  const onSubmit = (values: SV) => {
    if (editing) {
      updateCategory({ ...editing, name: values.name, description: values.description });
    } else {
      addCategory({ id: uid("CAT"), name: values.name, description: values.description, items: 0, color: CHART_PALETTE[state.categories.length % CHART_PALETTE.length] });
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const pageGradient = getPageGradient("categories");

  return (
    <div className={cn("min-h-screen", pageGradient)}>
      <div className="space-y-5 p-4 sm:p-6">
        <PageHeader
          title="Categories"
          description="Organize inventory into categories for easier management."
          breadcrumb={[{ label: "Categories" }]}
          actions={can("categories.manage") ? <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="size-4" /> Add Category</Button> : undefined}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(14,165,233,0.1) 100%)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl size-11 bg-primary/20 text-primary">
                <FolderTree className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Categories</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{categories.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(16,185,129,0.1) 100%)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl size-11 bg-sky-500/20 text-sky-500">
                <Box className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Range Of Devices</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{state.inventory.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(249,115,22,0.1) 100%)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl size-11 bg-amber-500/20 text-amber-500">
                <Tag className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Categories</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{categories.filter(c => state.inventory.some(i => i.category === c.name)).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.1) 100%)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl size-11 bg-violet-500/20 text-violet-500">
                <Hash className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Empty Categories</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{categories.filter(c => !state.inventory.some(i => i.category === c.name)).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
        ) : categories.length === 0 ? (
          <Card className="py-0 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.05) 100%)" }}>
            <CardContent className="p-0">
              <EmptyState icon={FolderTree} title="No categories yet" description="Add a category to organize your inventory." action={{ label: "Add Category", onClick: () => setDialogOpen(true) }} />
            </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((c, idx) => {
              const itemCount = state.inventory.filter((i) => i.category === c.name).length;
              const iconBg = getIconBgClass(idx);
              const cardGradient = getCardGradient(idx);
              return (
                <Card key={c.id} className="group relative py-5 transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${cardGradient})` }}>
                  <CardContent className="px-5">
                    <div className="flex items-start justify-between">
                      <div className={cn("flex size-11 items-center justify-center rounded-xl", iconBg)}>
                        <FolderTree className="size-5" />
                      </div>
                      {can("categories.manage") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => { setEditing(c); setDialogOpen(true); }}><Pencil className="size-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(c)}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{c.description}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <Badge variant="outline" className={cn("gap-1", iconBg.replace("bg-", "bg-").replace("text-", "text-"))}>
                        <Package className="size-3" />
                        {formatNumber(itemCount)} items
                      </Badge>
                      <span className={cn("text-xs", itemCount === 0 ? "text-rose-500" : "text-emerald-500")}>
                        {itemCount === 0 ? "no stock" : "active"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
              <DialogDescription>Categories group similar inventory items.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. Laboratory Equipment" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="What belongs in this category?" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">{editing ? "Save Changes" : "Add Category"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleting !== null}
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete this category?"
          description={deleting ? `This will permanently delete ${deleting.name}.` : ""}
          onConfirm={() => {
            if (deleting) {
              deleteCategory(deleting.id);
              toast.success(`${deleting.name} deleted`);
              setDeleting(null);
            }
          }}
        />
      </div>
    </div>
  );
}