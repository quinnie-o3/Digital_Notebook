import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Plus, Upload } from "lucide-react";

import { DAY_LABELS, minutesFromTime } from "../../lib/uitSchedule";
import { Subject } from "../../types";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { cn } from "../ui/utils";
import styles from "./WeeklySchedule.module.css";

interface WeeklyScheduleProps {
  subjects: Subject[];
  activeSubjectId?: string | null;
  selectedDate: string;
  selectedWeekLabel: string;
  onOpenNotebook: (subject: Subject) => void;
  onAddSubject: () => void;
  onImportSchedule: () => void;
  onMoveWeek: (direction: -1 | 1) => void;
  onSelectedDateChange: (date: string) => void;
}

interface SubjectPlacement {
  subject: Subject;
  dayIndex: number;
  rowIndex: number;
  rowSpan: number;
  topOffsetMinutes: number;
  durationMinutes: number;
}

interface ScheduleSlot {
  label: string;
  start: string;
  end: string;
}

const DEFAULT_TIMELINE_START_HOUR = 7;
const DEFAULT_TIMELINE_END_HOUR = 21;
const MINUTES_PER_HOUR = 60;
const WEEK_LENGTH_DAYS = 7;

function parseDateInputValue(value: string) {
  return new Date(`${value}T00:00:00`);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getWeekStart(date: Date) {
  const dayIndex = (date.getDay() + 6) % WEEK_LENGTH_DAYS;

  return addDays(date, -dayIndex);
}

function formatDayDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function timeFromHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function buildHourlySlots(startHour: number, endHour: number): ScheduleSlot[] {
  return Array.from({ length: endHour - startHour }, (_, index) => {
    const hour = startHour + index;
    const start = timeFromHour(hour);
    const end = timeFromHour(hour + 1);

    return {
      label: start,
      start,
      end,
    };
  });
}

function buildScheduleSlots(subjects: Subject[]): ScheduleSlot[] {
  if (!subjects.length) {
    return buildHourlySlots(DEFAULT_TIMELINE_START_HOUR, DEFAULT_TIMELINE_END_HOUR);
  }

  const subjectRanges = subjects.map((subject) => ({
    start: minutesFromTime(subject.startTime),
    end: minutesFromTime(subject.endTime),
  }));
  const earliestStart = Math.min(...subjectRanges.map((range) => range.start));
  const latestEnd = Math.max(...subjectRanges.map((range) => range.end));
  const startHour = Math.floor(earliestStart / MINUTES_PER_HOUR);
  const endHour = Math.ceil(latestEnd / MINUTES_PER_HOUR);

  return buildHourlySlots(startHour, Math.max(startHour + 1, endHour));
}

function getSubjectPlacement(subject: Subject, scheduleSlots: ScheduleSlot[]): SubjectPlacement | null {
  const startMinutes = minutesFromTime(subject.startTime);
  const endMinutes = minutesFromTime(subject.endTime);

  const exactRowIndex = scheduleSlots.findIndex(
    (slot) => slot.start === subject.startTime && slot.end === subject.endTime,
  );

  if (exactRowIndex >= 0) {
    return {
      subject,
      dayIndex: subject.day,
      rowIndex: exactRowIndex,
      rowSpan: 1,
      topOffsetMinutes: 0,
      durationMinutes: endMinutes - startMinutes,
    };
  }

  const rowIndex = scheduleSlots.findIndex((slot) => {
    const slotStart = minutesFromTime(slot.start);
    const slotEnd = minutesFromTime(slot.end);
    return startMinutes >= slotStart && startMinutes < slotEnd;
  });

  if (rowIndex < 0) {
    return null;
  }

  const rowSpan = scheduleSlots.filter((slot) => {
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
    topOffsetMinutes: startMinutes - minutesFromTime(scheduleSlots[rowIndex].start),
    durationMinutes: endMinutes - startMinutes,
  };
}

export function WeeklySchedule({
  subjects,
  activeSubjectId,
  selectedDate,
  selectedWeekLabel,
  onOpenNotebook,
  onAddSubject,
  onImportSchedule,
  onMoveWeek,
  onSelectedDateChange,
}: WeeklyScheduleProps) {
  const weekStart = getWeekStart(parseDateInputValue(selectedDate));
  const dayDates = DAY_LABELS.map((_, dayIndex) => formatDayDate(addDays(weekStart, dayIndex)));
  const scheduleSlots = buildScheduleSlots(subjects);
  const subjectPlacements = subjects
    .map((subject) => getSubjectPlacement(subject, scheduleSlots))
    .filter((placement): placement is SubjectPlacement => Boolean(placement))
    .sort((left, right) => {
      if (left.dayIndex !== right.dayIndex) {
        return left.dayIndex - right.dayIndex;
      }

      return left.rowIndex - right.rowIndex;
    });
  const subjectsByDay = DAY_LABELS.map((day, dayIndex) => ({
    day,
    subjects: subjects
      .filter((subject) => subject.day === dayIndex)
      .sort((left, right) => minutesFromTime(left.startTime) - minutesFromTime(right.startTime)),
  }));

  const gridStyle = {
    gridTemplateColumns: `minmax(10.5rem, 11.5rem) repeat(${DAY_LABELS.length}, minmax(10rem, 1fr))`,
    gridTemplateRows: `auto repeat(${scheduleSlots.length}, var(--schedule-hour-height))`,
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div>
            <p className={styles.eyebrow}>Digital Student Planner</p>
            <h2 className={styles.title}>Weekly timetable</h2>
            <p className={styles.description}>
              {selectedWeekLabel}
            </p>
          </div>

          <div className={styles.actions}>
            <div className={styles.weekControls}>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={styles.weekButton}
                onClick={() => onMoveWeek(-1)}
                aria-label="Previous week"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <label className={styles.datePickerLabel}>
                <CalendarDays className="size-4" />
                <input
                  type="date"
                  className={styles.datePicker}
                  value={selectedDate}
                  onChange={(event) => onSelectedDateChange(event.target.value)}
                />
              </label>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={styles.weekButton}
                onClick={() => onMoveWeek(1)}
                aria-label="Next week"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
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
              Add schedule item
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.mobileSchedule}>
        {subjectsByDay.map(({ day, subjects: daySubjects }, dayIndex) => (
          <section key={day} className={styles.mobileDay}>
            <h3 className={styles.mobileDayTitle}>
              <span>{day}</span>
              <span>{dayDates[dayIndex]}</span>
            </h3>

            {daySubjects.length > 0 ? (
              <div className={styles.mobileCards}>
                {daySubjects.map((subject) => (
                  <Card
                    key={subject.id}
                    className={cn(
                      styles.mobileSubjectCard,
                      activeSubjectId === subject.id && styles.subjectCardActive,
                    )}
                    style={{
                      backgroundColor: subject.color,
                      borderColor: "rgba(15, 23, 42, 0.08)",
                    }}
                    onClick={() => onOpenNotebook(subject)}
                  >
                    <div className={styles.subjectCardTopBar} />
                    <div className={styles.mobileSubjectTop}>
                      <div>
                        <div className={styles.subjectTitle}>{subject.name}</div>
                        <div className={styles.subjectMeta}>
                          <div>
                            {subject.startTime} - {subject.endTime}
                          </div>
                          {subject.room ? <div>{subject.room}</div> : null}
                          {subject.courseCode ? <div>{subject.courseCode}</div> : null}
                        </div>
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
            ) : (
              <div className={styles.mobileEmpty}>No classes</div>
            )}
          </section>
        ))}
      </div>

      <div className={styles.gridShell}>
        <div className={styles.grid} style={gridStyle}>
          <div className={styles.stickyPeriod} style={{ gridColumn: 1, gridRow: 1 }}>
            Time
          </div>

          {DAY_LABELS.map((day, dayIndex) => (
            <div
              key={day}
              className={styles.stickyDay}
              style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
            >
              <span>{day}</span>
              <span>{dayDates[dayIndex]}</span>
            </div>
          ))}

          {scheduleSlots.map((slot, rowIndex) => (
            <div
              key={`${slot.start}-${slot.end}`}
              className={styles.timeCell}
              style={{ gridColumn: 1, gridRow: rowIndex + 2 }}
            >
              <div className={styles.timeLabel}>{slot.label}</div>
              <div className={styles.timeRange}>
                {slot.start} - {slot.end}
              </div>
            </div>
          ))}

          {subjectPlacements.map(
            ({ subject, dayIndex, rowIndex, rowSpan, topOffsetMinutes, durationMinutes }) => {
              const topOffset = topOffsetMinutes / MINUTES_PER_HOUR;
              const duration = durationMinutes / MINUTES_PER_HOUR;

              return (
                <Card
                  key={subject.id}
                  className={cn(
                    styles.subjectCard,
                    activeSubjectId === subject.id && styles.subjectCardActive,
                  )}
                  style={{
                    backgroundColor: subject.color,
                    borderColor: "rgba(15, 23, 42, 0.14)",
                    gridColumn: dayIndex + 2,
                    gridRow: `${rowIndex + 2} / span ${rowSpan}`,
                    marginTop: `calc(${topOffset} * var(--schedule-hour-height))`,
                    height: `calc(${duration} * var(--schedule-hour-height) + ${
                      rowSpan - 1
                    } * var(--schedule-grid-gap))`,
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
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
