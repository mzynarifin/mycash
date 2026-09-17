"use client";

import { Check, ChevronsUpDown, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface SelectableUser {
  id: string;
  name: string;
  email: string | null;
  nim?: string | null;
}

interface BillUserPickerProps {
  users: SelectableUser[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

export function BillUserPicker({ users, selectedIds, onChange, multiple = true, search, onSearchChange }: BillUserPickerProps) {
  const normalized = search.trim().toLowerCase();
  const filtered = users.filter((user) =>
    `${user.name} ${user.nim ?? ""}`.toLowerCase().includes(normalized)
  );

  function toggle(id: string) {
    if (!multiple) return onChange([id]);
    onChange(selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id]);
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}>
        <span className="flex min-w-0 items-center gap-2">
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">
            {selectedIds.length === 0 ? "Pilih pengguna" : `${selectedIds.length} pengguna dipilih`}
          </span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(26rem,calc(100vw-2rem))] p-0">
        <div className="relative border-b border-border p-2">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Cari nama atau email..." className="pl-9" aria-label="Cari pengguna" />
        </div>
        <div className="max-h-64 overflow-y-auto p-1" role="listbox" aria-multiselectable={multiple}>
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Pengguna tidak ditemukan.</p>
          ) : filtered.map((user) => {
            const selected = selectedIds.includes(user.id);
            return (
              <button key={user.id} type="button" role="option" aria-selected={selected} onClick={() => toggle(user.id)} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className={cn("flex size-4 shrink-0 items-center justify-center rounded border border-input", selected && "border-primary bg-primary text-primary-foreground")}>
                  {selected && <Check className="size-3" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{user.name}</span>
                  {user.nim && <span className="block truncate text-xs text-muted-foreground">NIM {user.nim}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
