import { useEffect, useMemo, useState } from "react";
import { Save, UserRound } from "lucide-react";

import { UserProfile } from "../../types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import styles from "./UserProfileDialog.module.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

interface AppUserResponse {
  userId: number;
  email: string;
  passwordHash: string;
}

interface UserProfileResponse {
  profileId: number;
  userId: number;
  fullName?: string | null;
  avatarUrl?: string | null;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileSaved?: (profile: UserProfile) => void;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  onProfileSaved,
}: UserProfileDialogProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    async function loadProfile() {
      setIsLoading(true);
      setStatus(null);

      try {
        const usersResponse = await fetch(`${API_BASE_URL}/api/app-users`, {
          signal: controller.signal,
        });

        if (!usersResponse.ok) {
          throw new Error("Could not load user information.");
        }

        const users = (await usersResponse.json()) as AppUserResponse[];
        const user = users[0];

        if (!user) {
          throw new Error("No user found in the database.");
        }

        const profileResponse = await fetch(`${API_BASE_URL}/api/user-profiles/user/${user.userId}`, {
          signal: controller.signal,
        });
        const userProfile = profileResponse.ok
          ? ((await profileResponse.json()) as UserProfileResponse)
          : null;
        const data: UserProfile = {
          userId: user.userId,
          profileId: userProfile?.profileId,
          name: userProfile?.fullName || user.email,
          fullName: userProfile?.fullName || "",
          email: user.email,
          passwordHash: user.passwordHash,
          avatarUrl: userProfile?.avatarUrl,
        };

        setProfile(data);
        setName(data.fullName || data.email);
        setPassword(data.passwordHash ?? "");
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatus(error instanceof Error ? error.message : "Could not load user information.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [open]);

  const initials = useMemo(() => {
    const source = name.trim() || profile?.email || "U";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [name, profile?.email]);

  async function handleSave() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setStatus("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      if (!profile) {
        throw new Error("No user loaded.");
      }

      const userResponse = await fetch(`${API_BASE_URL}/api/app-users/${profile.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: profile.userId,
          email: profile.email,
          passwordHash: password,
          role: "student",
          status: "active",
        }),
      });

      if (!userResponse.ok) {
        throw new Error("Could not save user information.");
      }

      const profilePath = profile.profileId
        ? `/api/user-profiles/${profile.profileId}`
        : "/api/user-profiles";
      const profileResponse = await fetch(`${API_BASE_URL}${profilePath}`, {
        method: profile.profileId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: profile.profileId,
          userId: profile.userId,
          fullName: trimmedName,
          avatarUrl: profile.avatarUrl,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error("Could not save profile information.");
      }

      const savedProfile = (await profileResponse.json()) as UserProfileResponse;
      const updatedProfile: UserProfile = {
        ...profile,
        profileId: savedProfile.profileId,
        name: savedProfile.fullName || profile.email,
        fullName: savedProfile.fullName || "",
        passwordHash: password,
        avatarUrl: savedProfile.avatarUrl,
      };

      setProfile(updatedProfile);
      setName(updatedProfile.fullName || updatedProfile.email);
      setPassword(updatedProfile.passwordHash ?? "");
      onProfileSaved?.(updatedProfile);
      setStatus("Saved changes to the database.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save user information.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>User information</DialogTitle>
          <DialogDescription>View avatar and email. Edit name or password only.</DialogDescription>
        </DialogHeader>

        <div className={styles.profileHead}>
          <Avatar className={styles.avatar}>
            {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.name} /> : null}
            <AvatarFallback className={styles.avatarFallback}>
              {initials || <UserRound className="size-7" />}
            </AvatarFallback>
          </Avatar>

          <div className={styles.profileText}>
            <p className={styles.profileName}>{name || "Unnamed user"}</p>
            <p className={styles.profileEmail}>{profile?.email || "No email"}</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLoading || isSaving}
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="profile-avatar">Avatar URL</Label>
            <Input id="profile-avatar" value={profile?.avatarUrl ?? ""} disabled readOnly />
          </div>

          <div className={styles.field}>
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={profile?.email ?? ""} disabled readOnly />
          </div>

          <div className={styles.field}>
            <Label htmlFor="profile-password">Password</Label>
            <Input
              id="profile-password"
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading || isSaving}
            />
          </div>
        </div>

        {status ? <p className={styles.status}>{status}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving || !profile}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
