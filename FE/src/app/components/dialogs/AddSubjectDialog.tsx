import { useState } from "react";

import { DAY_LABELS, UIT_PERIOD_SLOTS, minutesFromTime } from "../../lib/uitSchedule";
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
  onAddSubject: (subject: Omit<Subject, "id">) => void;
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
  const [startTime, setStartTime] = useState("07:30");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");

  const availableEndTimes = UIT_PERIOD_SLOTS.map((slot) => slot.end).filter(
    (time) => minutesFromTime(time) > minutesFromTime(startTime),
  );

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }

    onAddSubject({
      name,
      color,
      day,
      startTime,
      endTime,
      room: room.trim() || undefined,
    });

    setName("");
    setColor(PASTEL_COLORS[0]);
    setDay(0);
    setStartTime("07:30");
    setEndTime("09:00");
    setRoom("");
    onOpenChange(false);
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
              <Select
                value={startTime}
                onValueChange={(value) => {
                  setStartTime(value);

                  if (minutesFromTime(endTime) <= minutesFromTime(value)) {
                    const nextEndTime =
                      UIT_PERIOD_SLOTS.find(
                        (slot) => minutesFromTime(slot.end) > minutesFromTime(value),
                      )?.end || value;
                    setEndTime(nextEndTime);
                  }
                }}
              >
                <SelectTrigger id="startTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UIT_PERIOD_SLOTS.map((slot) => (
                    <SelectItem key={slot.period} value={slot.start}>
                      Period {slot.period} - {slot.start}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={styles.field}>
              <Label htmlFor="endTime">End</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="endTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableEndTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className={styles.submitButton}>
            Add class
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
