"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { updateProfileNameAction, updateThemeAction } from "@/actions/profile-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }
    setSaving(true);
    const result = await updateProfileNameAction(trimmed);
    setSaving(false);
    if (result.success) {
      toast.success("Profil berhasil diperbarui.");
    } else {
      toast.error(result.message);
    }
  }

  function changeTheme(t: "light" | "dark" | "system") {
    setTheme(t);
    updateThemeAction(t).then((result) => {
      if (!result.success) toast.error(result.message);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Settings"
        description="Atur profil dan preferensi akun Anda."
      />

      <Section
        title="Profile"
        description="Informasi dasar yang ditampilkan di aplikasi."
      >
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-accent text-accent-foreground font-medium">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              Foto profil belum tersedia di fase ini.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={user.email}
                disabled
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </div>
        </div>
      </Section>

      <Separator />

      <Section
        title="Preferences"
        description="Opsi tampilan sesuai kebutuhan Anda."
      >
        <div className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select defaultValue="IDR" disabled>
              <SelectTrigger className="sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDR">IDR — Indonesian Rupiah</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {user.currency === "IDR"
                ? "Mata uang kamu sudah diset ke IDR."
                : "Mata uang lain menyusul pada fase berikutnya."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {(["light", "system", "dark"] as const).map((t) => (
                <Button
                  key={t}
                  variant={resolvedTheme === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeTheme(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Separator />

      <Section
        title="Account"
        description="Kelola akses ke akun Anda."
      >
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => logout()}
        >
          <LogOut size={16} className="mr-2" aria-hidden="true" />
          Logout
        </Button>
      </Section>
    </div>
  );
}