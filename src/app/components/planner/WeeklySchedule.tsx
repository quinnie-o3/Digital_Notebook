import { BookOpen, Plus, Upload } from "lucide-react";

import { DAY_LABELS, UIT_PERIOD_SLOTS, minutesFromTime } from "../../lib/uitSchedule";
import { Subject } from "../../types";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { cn } from "../ui/utils";
import styles from "./WeeklySchedule.module.css";

interface WeeklyScheduleProps {
  subjects: Subject[];
  activeSubjectId?: string | null;
  onOpenNotebook: (subject: Subject) => void;
  onAddSubject: () => void;
  onImportSchedule: () => void;
}

interface SubjectPlacement {
  subject: Subject;
  dayIndex: number;
  rowIndex: number;
  rowSpan: number;
}

function getSubjectPlacement(subject: Subject): SubjectPlacement | null {
  const startMinutes = minutesFromTime(subject.startTime);
  const endMinutes = minutesFromTime(subject.endTime);

  const rowIndex = UIT_PERIOD_SLOTS.findIndex((slot) => {
    const slotStart = minutesFromTime(slot.start);
    const slotEnd = minutesFromTime(slot.end);
    return startMinutes >= slotStart && startMinutes < slotEnd;
  });

  if (rowIndex < 0) {
    return null;
  }

  const rowSpan = UIT_PERIOD_SLOTS.filter((slot) => {
    const slotStart = minutesFromTime(slot.start);
    const slotEnd = minutesFromTime(slot.end);
    return startMinutes < slotEnd && endMinutes > slotStart;
  }).length;

  if (rowSpan === 0) {
    return null;
  }

  return {
    subject,
    dayIndex: subject.day,
    rowIndex,
    rowSpan,
  };
}

export function WeeklySchedule({
  subjects,
  activeSubjectId,
  onOpenNotebook,
  onAddSubject,
  onImportSchedule,
}: WeeklyScheduleProps) {
  const subjectPlacements = subjects
    .map((subject) => getSubjectPlacement(subject))
    .filter((placement): placement is SubjectPlacement => Boolean(placement))
    .sort((left, right) => {
      if (left.dayIndex !== right.dayIndex) {
        return left.dayIndex - right.dayIndex;
      }

      return left.rowIndex - right.rowIndex;
    });

  const occupiedCells = new Set<string>();
  subjectPlacements.forEach(({ dayIndex, rowIndex, rowSpan }) => {
    for (let offset = 0; offset < rowSpan; offset += 1) {
      occupiedCells.add(`${dayIndex}-${rowIndex + offset}`);
    }
  });

  const gridStyle = {
    gridTemplateColumns: `minmax(10.5rem, 11.5rem) repeat(${DAY_LABELS.length}, minmax(10rem, 1fr))`,
    gridTemplateRows: `auto repeat(${UIT_PERIOD_SLOTS.length}, minmax(6rem, auto))`,
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div>
            <p className={styles.eyebrow}>Digital Student Planner</p>
            <h2 className={styles.title}>Weekly timetable</h2>
            <p className={styles.description}>
              Open the notebook icon on each class card instead of splitting the screen in half.
            </p>
          </div>

          <div className={styles.actions}>
            <Button
              onClick={onImportSchedule}
              variant="outline"
              className={styles.importButton}
            >
              <Upload className="mr-2 size-4" />
              Import from UIT Student
            </Button>
            <Button onClick={onAddSubject} className={styles.addButton}>
              <Plus className="mr-2 size-4" />
              Add class manually
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.gridShell}>
        <div className={styles.grid} style={gridStyle}>
          <div className={styles.stickyPeriod} style={{ gridColumn: 1, gridRow: 1 }}>
            Period
          </div>

          {DAY_LABELS.map((day, dayIndex) => (
            <div
              key={day}
              className={styles.stickyDay}
              style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
            >
              {day}
            </div>
          ))}

          {UIT_PERIOD_SLOTS.map((slot, rowIndex) => (
            <div
              key={slot.period}
              className={styles.timeCell}
              style={{ gridColumn: 1, gridRow: rowIndex + 2 }}
            >
              <div className={styles.timeLabel}>Period {slot.period}</div>
              <div className={styles.timeRange}>
                {slot.start} - {slot.end}
              </div>
            </div>
          ))}

          {UIT_PERIOD_SLOTS.flatMap((_, rowIndex) =>
            DAY_LABELS.map((_, dayIndex) => {
              const cellKey = `${dayIndex}-${rowIndex}`;

              if (occupiedCells.has(cellKey)) {
                return null;
              }

              return (
                <div
                  key={cellKey}
                  className={styles.emptyCell}
                  style={{ gridColumn: dayIndex + 2, gridRow: rowIndex + 2 }}
                />
              );
            }),
          )}

          {subjectPlacements.map(({ subject, dayIndex, rowIndex, rowSpan }) => (
            <Card
              key={subject.id}
              className={cn(
                styles.subjectCard,
                activeSubjectId === subject.id && styles.subjectCardActive,
              )}
              style={{
                backgroundColor: subject.color,
                borderColor: "rgba(15, 23, 42, 0.08)",
                gridColumn: dayIndex + 2,
                gridRow: `${rowIndex + 2} / span ${rowSpan}`,
              }}
              onClick={() => onOpenNotebook(subject)}
            >
              <div className={styles.subjectCardTopBar} />
              <div className={styles.subjectTitle}>{subject.name}</div>

              <div className={styles.subjectMeta}>
                <div>
                  {subject.startTime} - {subject.endTime}
                </div>
                {subject.room ? <div>{subject.room}</div> : null}
                {subject.courseCode ? <div>{subject.courseCode}</div> : null}
              </div>

              <div className={styles.subjectFooter}>
                <div className={styles.subjectSource}>
                  {subject.source === "uit" ? "Imported from UIT" : "Added manually"}
                </div>
                <Button
                  type="button"
                  size="icon"
                  className={styles.subjectButton}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenNotebook(subject);
                  }}
                >
                  <BookOpen className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
