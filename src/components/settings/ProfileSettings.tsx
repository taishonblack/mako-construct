import { useState, useRef } from "react";
import { UserCircle, Camera, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ProfileSettings() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [roleTitle, setRoleTitle] = useState(profile?.role_title ?? "");
  const [organization, setOrganization] = useState(profile?.organization ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be under 2 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      await updateProfile({ avatar_url: url });
      toast.success("Avatar updated");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || user?.email || "",
        role_title: roleTitle.trim(),
        organization: organization.trim(),
        avatar_url: avatarUrl,
      });
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="steel-panel p-6 text-center">
        <p className="text-sm text-muted-foreground">Sign in to manage your profile</p>
      </div>
    );
  }

  const initials = (displayName || user.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="steel-panel p-6 space-y-6">
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Profile</h2>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-16 h-16 rounded-full bg-secondary border border-border overflow-hidden group hover:border-primary transition-colors"
          disabled={uploading}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-lg font-medium text-foreground">
              {initials}
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-foreground" />
            ) : (
              <Camera className="w-4 h-4 text-foreground" />
            )}
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <div>
          <p className="text-sm text-foreground font-medium">{displayName || user.email}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="bg-secondary border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Role / Title</label>
          <Input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="e.g. Lead Engineer"
            className="bg-secondary border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Organization</label>
          <Input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="e.g. MAKO Broadcast Operations"
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground bg-primary rounded hover:glow-red transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </div>
  );
}
