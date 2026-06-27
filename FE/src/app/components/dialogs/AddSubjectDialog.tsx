import { useState } from "react";

import { DAY_LABELS, minutesFromTime } from "../../lib/uitSchedule";
import { Subject } from "../../types";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dayIndexFromDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return (date.getDay() + 6) % 7;
}

export function AddSubjectDialog({ open, onOpenChange, onAddSubject }: AddSubjectDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PASTEL_COLORS[0]);
  const [classDate, setClassDate] = useState(formatDateInputValue(new Date()));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedDayIndex = dayIndexFromDate(classDate);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage("Enter a title before adding it.");
      return;
    }

    if (!classDate) {
      setErrorMessage("Choose a date before adding this item.");
      return;
    }

    if (!startTime || !endTime || minutesFromTime(endTime) <= minutesFromTime(startTime)) {
      setErrorMessage("Choose an end time later than the start time.");
      return;
    }

    const day = dayIndexFromDate(classDate);

    if (day === null) {
      setErrorMessage("Choose a valid date before adding this item.");
      return;
    }

    const shouldRepeatWeekly = window.confirm(
      `Add this item to every ${DAY_LABELS[day]} from ${classDate} onward?\n\nOK = repeat weekly\nCancel = only ${classDate}`,
    );

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
        startDate: classDate,
        endDate: shouldRepeatWeekly ? undefined : classDate,
      });

      setName("");
      setColor(PASTEL_COLORS[0]);
      setClassDate(formatDateInputValue(new Date()));
      setStartTime("08:00");
      setEndTime("09:00");
      setRoom("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add class.", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not add this item. Check that the backend is running.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Add a schedule item</DialogTitle>
        </DialogHeader>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <Label htmlFor="name">Title</Label>
            <Input
              id="name"
              placeholder="Example: Midterm review or Data Structures"
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
            <Label htmlFor="classDate">Date</Label>
            <Input
              id="classDate"
              type="date"
              value={classDate}
              onChange={(event) => setClassDate(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="weekday">Day</Label>
            <Input
              id="weekday"
              value={selectedDayIndex === null ? "" : DAY_LABELS[selectedDayIndex]}
              readOnly
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

          <div className={styles.field}>
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              placeholder="Example: Room E3.1"
              value={room}
              onChange={(event) => setRoom(event.target.value)}
            />
          </div>
        </div>

        {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className={styles.submitButton} disabled={isSaving}>
            {isSaving ? "Adding..." : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
