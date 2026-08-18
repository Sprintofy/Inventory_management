import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.ComponentProps<"input"> {
  onClear?: () => void;
}

export function SearchInput({ className, value, onChange, onClear, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input value={value} onChange={onChange} className="h-9 w-full pr-9 pl-9" {...props} />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
