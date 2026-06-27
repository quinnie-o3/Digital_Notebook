import { useState } from "react";

import { DAY_LABELS, minutesFromTime } from "../../lib/uitSchedule";
import { Subject } from "../../types";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../ui/utils";
import styles from "./AddSubjectDialog.module.css";

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSubject: (subject: Omit<Subject, "id">) => void | Promise<void>;
}

const PASTEL_COLORS = [
  "#FFD4E5",
  "#FFDAB9",
  "#FFFACD",
  "#D4F1D4",
  "#D4E4FF",
  "#E6D4FF",
  "#FFE4D4",
  "#F0D4FF",
];

export function AddSubjectDialog({ open, onOpenChange, onAddSubject }: AddSubjectDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PASTEL_COLORS[0]);
  const [day, setDay] = useState<number>(0);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage("Enter a class name before adding it.");
      return;
    }

    if (!startTime || !endTime || minutesFromTime(endTime) <= minutesFromTime(startTime)) {
      setErrorMessage("Choose an end time later than the start time.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onAddSubject({
        name: name.trim(),
        color,
        day,
        startTime,
        endTime,
        room: room.trim() || undefined,
        source: "manual",
      });

      setName("");
      setColor(PASTEL_COLORS[0]);
      setDay(0);
      setStartTime("08:00");
      setEndTime("09:00");
      setRoom("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add class.", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not add this class. Check that the backend is running.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Add a new class</DialogTitle>
        </DialogHeader>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <Label htmlFor="name">Class name</Label>
            <Input
              id="name"
              placeholder="Example: Data Structures and Algorithms"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <Label>Color</Label>
            <div className={styles.colorGrid}>
              {PASTEL_COLORS.map((paletteColor) => (
                <button
                  key={paletteColor}
                  type="button"
                  className={cn(
                    styles.colorButton,
                    color === paletteColor ? styles.colorButtonActive : styles.colorButtonInactive,
                  )}
                  style={{ backgroundColor: paletteColor }}
                  onClick={() => setColor(paletteColor)}
                />
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <Label htmlFor="day">Day</Label>
            <Select value={day.toString()} onValueChange={(value) => setDay(Number(value))}>
              <SelectTrigger id="day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_LABELS.map((label, index) => (
                  <SelectItem key={label} value={index.toString()}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.field}>
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              placeholder="Example: Room E3.1"
              value={room}
              onChange={(event) => setRoom(event.target.value)}
            />
          </div>

          <div className={styles.timeGrid}>
            <div className={styles.field}>
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                step={300}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                step={300}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>
        </div>

        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className={styles.submitButton} disabled={isSaving}>
            {isSaving ? "Adding..." : "Add class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
