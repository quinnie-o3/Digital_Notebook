import { useEffect, useMemo, useState } from "react";
import { Pencil, UserRound } from "lucide-react";

import { authFetch } from "../../lib/authApi";
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

interface AppUserResponse {
  userId: number;
  email: string;
}

interface UserProfileResponse {
  fullName?: string | null;
  avatarUrl?: string | null;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditPassword: () => void;
}

export function UserProfileDialog({ open, onOpenChange, onEditPassword }: UserProfileDialogProps) {
  const [user, setUser] = useState<AppUserResponse | null>(null);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();

    async function loadProfile() {
      setIsLoading(true);
      setStatus(null);
      try {
        const userResponse = await authFetch("/api/app-users/me", { signal: controller.signal });
        if (!userResponse.ok) throw new Error("Could not load user information.");

        const currentUser = (await userResponse.json()) as AppUserResponse;
        const profileResponse = await authFetch("/api/user-profiles/me", {
          signal: controller.signal,
        });
        setUser(currentUser);
        setProfile(
          profileResponse.ok ? ((await profileResponse.json()) as UserProfileResponse) : null,
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatus(error instanceof Error ? error.message : "Could not load user information.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [open]);

  const displayName = profile?.fullName || user?.email || "Unnamed user";
  const initials = useMemo(
    () => displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""),
    [displayName],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>User information</DialogTitle>
          <DialogDescription>View your account information and security settings.</DialogDescription>
        </DialogHeader>

        <div className={styles.profileHead}>
          <Avatar className={styles.avatar}>
            {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className={styles.avatarFallback}>
              {initials || <UserRound className="size-7" />}
            </AvatarFallback>
          </Avatar>
          <div className={styles.profileText}>
            <p className={styles.profileName}>{displayName}</p>
            <p className={styles.profileEmail}>{user?.email || "No email"}</p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" value={displayName} disabled readOnly />
          </div>
          <div className={styles.field}>
            <Label htmlFor="profile-avatar">Avatar URL</Label>
            <Input id="profile-avatar" value={profile?.avatarUrl ?? ""} disabled readOnly />
          </div>
          <div className={styles.field}>
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user?.email ?? ""} disabled readOnly />
          </div>
          <div className={styles.field}>
            <div className={styles.passwordHeading}>
              <Label htmlFor="profile-password">Password</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={styles.editPasswordButton}
                onClick={onEditPassword}
                disabled={isLoading}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </div>
            <Input id="profile-password" value="••••••••" disabled readOnly />
          </div>
        </div>

        {status ? <p className={styles.status}>{status}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
