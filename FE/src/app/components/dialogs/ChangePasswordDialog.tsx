import { useMemo, useState } from "react";
import { ArrowLeft, KeyRound, Save } from "lucide-react";

import { authFetch } from "../../lib/authApi";
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
import styles from "./ChangePasswordDialog.module.css";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
}

interface PasswordApiError {
  field?: "currentPassword" | "newPassword";
  message?: string;
}

export function ChangePasswordDialog({ open, onOpenChange, onBack }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordServerError, setNewPasswordServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const newPasswordError = useMemo(() => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return "Password must be at least 8 characters.";
    if (currentPassword && newPassword === currentPassword) {
      return "Mật khẩu mới không được trùng mật khẩu cũ";
    }
    return newPasswordServerError;
  }, [currentPassword, newPassword, newPasswordServerError]);

  const confirmPasswordError =
    confirmPassword && confirmPassword !== newPassword ? "Password chưa trùng khớp" : null;
  const canSave =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword !== currentPassword &&
    confirmPassword === newPassword &&
    !isSaving;

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPasswordError(null);
    setNewPasswordServerError(null);
    setSuccessMessage(null);
  }

  function handleBack() {
    resetForm();
    onBack();
  }

  async function handleSave() {
    if (!canSave) return;

    setIsSaving(true);
    setCurrentPasswordError(null);
    setNewPasswordServerError(null);
    setSuccessMessage(null);

    try {
      const response = await authFetch("/api/app-users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as PasswordApiError;
        if (error.field === "currentPassword") {
          setCurrentPasswordError(error.message || "Current password is incorrect.");
        } else if (error.field === "newPassword") {
          setNewPasswordServerError(error.message || "New password is invalid.");
        } else {
          setNewPasswordServerError("Could not update password.");
        }
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password updated successfully.");
    } catch {
      setNewPasswordServerError("Could not update password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className={styles.content}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          <ArrowLeft className="size-4" />
          User information
        </button>

        <DialogHeader>
          <div className={styles.titleIcon}><KeyRound className="size-5" /></div>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Verify your current password before choosing a new one.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setCurrentPasswordError(null);
                setNewPasswordServerError(null);
              }}
              disabled={isSaving}
            />
            {currentPasswordError ? <p className={styles.error}>{currentPasswordError}</p> : null}
          </div>

          <div className={styles.field}>
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setNewPasswordServerError(null);
              }}
              disabled={isSaving}
            />
            {newPasswordError ? <p className={styles.error}>{newPasswordError}</p> : null}
          </div>

          <div className={styles.field}>
            <Label htmlFor="confirm-new-password">Confirm new password</Label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isSaving}
            />
            {confirmPasswordError ? <p className={styles.error}>{confirmPasswordError}</p> : null}
          </div>
        </div>

        {successMessage ? <p className={styles.success}>{successMessage}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={handleBack}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
