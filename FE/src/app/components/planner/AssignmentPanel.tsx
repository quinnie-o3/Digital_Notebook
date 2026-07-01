import { useEffect, useState } from "react";
import { differenceInCalendarDays, isValid, parseISO, startOfDay } from "date-fns";
import {
  AlertTriangle,
  BellRing,
  BookOpen,
  CalendarCheck2,
  Clock3,
  MapPin,
  NotebookPen,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { DAY_LABELS } from "../../lib/uitSchedule";
import { Assignment, HomeworkItem, Subject } from "../../types";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";
import styles from "./AssignmentPanel.module.css";

interface AssignmentPanelProps {
  selectedSubject: Subject | null;
  assignment: Assignment | null;
  onSaveAssignment: (assignment: Assignment) => Promise<void>;
  onClose: () => void;
}

const createAssignmentDraft = (subjectId: string, assignment: Assignment | null): Assignment => {
  if (!assignment) {
    return {
      id: `assignment-${subjectId}`,
      subjectId,
      lessonNotes: "",
      homework: [],
      deadline: "",
    };
  }

  return {
    ...assignment,
    homework: assignment.homework.map((item) => ({ ...item })),
  };
};

type DeadlineTone = "overdue" | "today" | "soon" | "later" | "complete";

interface DeadlineStatus {
  tone: DeadlineTone;
  title: string;
  message: string;
}

function formatDayCount(days: number) {
  return days === 1 ? "1 day" : `${days} days`;
}

function getDeadlineStatus(
  deadline: string,
  hasHomework: boolean,
  hasOpenHomework: boolean,
): DeadlineStatus | null {
  if (!deadline) {
    return null;
  }

  const parsedDeadline = parseISO(deadline);

  if (!isValid(parsedDeadline)) {
    return null;
  }

  const daysUntilDeadline = differenceInCalendarDays(
    startOfDay(parsedDeadline),
    startOfDay(new Date()),
  );

  if (hasHomework && !hasOpenHomework) {
    return {
      tone: "complete",
      title: "Deadline clear",
      message: "All homework items are completed for this deadline.",
    };
  }

  if (daysUntilDeadline < 0) {
    return {
      tone: "overdue",
      title: "Overdue",
      message: `This deadline passed ${formatDayCount(Math.abs(daysUntilDeadline))} ago.`,
    };
  }

  if (daysUntilDeadline === 0) {
    return {
      tone: "today",
      title: "Due today",
      message: "This deadline is today. Finish the remaining homework before the day ends.",
    };
  }

  if (daysUntilDeadline === 1) {
    return {
      tone: "soon",
      title: "Due tomorrow",
      message: "This deadline is tomorrow.",
    };
  }

  if (daysUntilDeadline <= 3) {
    return {
      tone: "soon",
      title: `Due in ${formatDayCount(daysUntilDeadline)}`,
      message: "This deadline is coming up soon.",
    };
  }

  return {
    tone: "later",
    title: `Due in ${formatDayCount(daysUntilDeadline)}`,
    message: "This deadline is scheduled and will be tracked here.",
  };
}

export function AssignmentPanel({
  selectedSubject,
  assignment,
  onSaveAssignment,
  onClose,
}: AssignmentPanelProps) {
  const [newHomework, setNewHomework] = useState("");
  const [draftAssignment, setDraftAssignment] = useState<Assignment | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setNewHomework("");
    setSaveState("idle");
  }, [selectedSubject?.id]);

  useEffect(() => {
    setDraftAssignment(selectedSubject ? createAssignmentDraft(selectedSubject.id, assignment) : null);
  }, [assignment, selectedSubject?.id]);

  if (!selectedSubject) {
    return (
      <div className={styles.emptyState}>
        <div className="text-center">
          <div className={styles.emptyStateIcon}>
            <BookOpen className="size-8 text-amber-700" />
          </div>
          <p className={styles.emptyStateText}>Select a class to open its notebook page</p>
        </div>
      </div>
    );
  }

  const persistedAssignment = createAssignmentDraft(selectedSubject.id, assignment);
  const hasUnsavedChanges =
    draftAssignment !== null &&
    JSON.stringify(draftAssignment) !== JSON.stringify(persistedAssignment);
  const isSaving = saveState === "saving";
  const hasHomework = (draftAssignment?.homework.length ?? 0) > 0;
  const hasOpenHomework = draftAssignment?.homework.some((item) => !item.completed) ?? false;
  const deadlineStatus = getDeadlineStatus(draftAssignment?.deadline || "", hasHomework, hasOpenHomework);

  const updateDraftAssignment = (updater: (current: Assignment) => Assignment) => {
    setSaveState("idle");
    setDraftAssignment((current) => (current ? updater(current) : current));
  };

  const handleAddHomework = () => {
    const task = newHomework.trim();

    if (!task) {
      return;
    }

    const newItem: HomeworkItem = {
      id: `draft-${Date.now()}`,
      text: task,
      completed: false,
    };

    updateDraftAssignment((current) => ({
      ...current,
      homework: [...current.homework, newItem],
    }));
    setNewHomework("");
  };

  const handleToggleHomework = (homeworkId: string) => {
    updateDraftAssignment((current) => ({
      ...current,
      homework: current.homework.map((item) =>
        item.id === homeworkId ? { ...item, completed: !item.completed } : item,
      ),
    }));
  };

  const handleDeleteHomework = (homeworkId: string) => {
    updateDraftAssignment((current) => ({
      ...current,
      homework: current.homework.filter((item) => item.id !== homeworkId),
    }));
  };

  const handleUpdateNotes = (notes: string) => {
    updateDraftAssignment((current) => ({
      ...current,
      lessonNotes: notes,
    }));
  };

  const handleUpdateDeadline = (deadline: string) => {
    updateDraftAssignment((current) => ({
      ...current,
      deadline,
    }));
  };

  const handleSave = async () => {
    if (!draftAssignment || !hasUnsavedChanges) {
      return;
    }

    setSaveState("saving");

    try {
      await onSaveAssignment(draftAssignment);
      setSaveState("saved");
    } catch (error) {
      console.error("Failed to save notebook entry.", error);
      setSaveState("error");
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.paperLines} />

      <div className={styles.content}>
        <div className={styles.subjectCard} style={{ backgroundColor: selectedSubject.color }}>
          <div className={styles.subjectHeader}>
            <div>
              <p className={styles.notebookPill}>
                <NotebookPen className="size-3.5" />
                Notebook page
              </p>
              <h2 className={styles.subjectTitle}>{selectedSubject.name}</h2>

              <div className={styles.subjectMetaRow}>
                <span className={styles.subjectMetaChip}>
                  <Clock3 className="size-4" />
                  {DAY_LABELS[selectedSubject.day]} - {selectedSubject.startTime} -{" "}
                  {selectedSubject.endTime}
                </span>

                {selectedSubject.room ? (
                  <span className={styles.subjectMetaChip}>
                    <MapPin className="size-4" />
                    {selectedSubject.room}
                  </span>
                ) : null}

                {selectedSubject.courseCode ? (
                  <span className={styles.subjectCodeChip}>{selectedSubject.courseCode}</span>
                ) : null}
              </div>
            </div>

            {selectedSubject.startDate || selectedSubject.endDate ? (
              <div className={styles.subjectDateBox}>
                <div>Start: {selectedSubject.startDate || "N/A"}</div>
                <div>End: {selectedSubject.endDate || "N/A"}</div>
              </div>
            ) : null}
          </div>

          {selectedSubject.note ? <p className={styles.subjectNote}>{selectedSubject.note}</p> : null}
        </div>

        <Card className={styles.sectionCard}>
          <Label className={styles.sectionLabel}>Lesson notes</Label>
          <Textarea
            placeholder="Summarize the lesson, lecturer notes, and things to review..."
            value={draftAssignment?.lessonNotes || ""}
            onChange={(event) => handleUpdateNotes(event.target.value)}
            className={styles.notesInput}
          />
        </Card>

        <Card className={styles.sectionCard}>
          <Label className={styles.sectionLabelSpaced}>Homework</Label>

          <div className={styles.homeworkList}>
            {draftAssignment?.homework.map((item) => (
              <div key={item.id} className={styles.homeworkItem}>
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleHomework(item.id)}
                  className="border-amber-500"
                />
                <span
                  className={cn(
                    styles.homeworkText,
                    item.completed && styles.homeworkTextCompleted,
                  )}
                >
                  {item.text}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteHomework(item.id)}
                  className={styles.deleteButton}
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            ))}
          </div>

          <div className={styles.taskComposer}>
            <Input
              placeholder="Add a new task..."
              value={newHomework}
              onChange={(event) => setNewHomework(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleAddHomework()}
              className={styles.taskInput}
            />
            <Button onClick={handleAddHomework} size="sm" className={styles.primaryButton}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className={styles.sectionCardLast}>
          <Label className={styles.sectionLabel}>Deadline</Label>
          <Input
            type="date"
            value={draftAssignment?.deadline || ""}
            onChange={(event) => handleUpdateDeadline(event.target.value)}
            className={cn(
              styles.deadlineInput,
              deadlineStatus?.tone === "overdue"
                ? styles.deadlineOverdue
                : deadlineStatus?.tone === "today" || deadlineStatus?.tone === "soon"
                  ? styles.deadlineNear
                  : styles.deadlineNormal,
            )}
          />
          {deadlineStatus ? (
            <div
              className={cn(
                styles.deadlineNotice,
                deadlineStatus.tone === "overdue"
                  ? styles.deadlineNoticeOverdue
                  : deadlineStatus.tone === "today"
                    ? styles.deadlineNoticeToday
                    : deadlineStatus.tone === "soon"
                      ? styles.deadlineNoticeSoon
                      : deadlineStatus.tone === "complete"
                        ? styles.deadlineNoticeComplete
                        : styles.deadlineNoticeLater,
              )}
            >
              {deadlineStatus.tone === "overdue" ? (
                <AlertTriangle className="size-4" />
              ) : deadlineStatus.tone === "complete" ? (
                <CalendarCheck2 className="size-4" />
              ) : (
                <BellRing className="size-4" />
              )}
              <div>
                <p className={styles.deadlineNoticeTitle}>{deadlineStatus.title}</p>
                <p className={styles.deadlineNoticeMessage}>{deadlineStatus.message}</p>
              </div>
            </div>
          ) : null}
        </Card>

        <div className={styles.footer}>
          <p
            className={cn(
              styles.statusText,
              saveState === "error"
                ? styles.statusError
                : saveState === "saved"
                  ? styles.statusSaved
                  : hasUnsavedChanges
                    ? styles.statusPending
                    : styles.statusIdle,
            )}
          >
            {saveState === "error"
              ? "Save failed. Please try again."
              : saveState === "saved"
                ? "Notebook saved!"
                : hasUnsavedChanges
                  ? "You have unsaved changes."
                  : "Make changes, then press Save."}
          </p>

          <div className={styles.footerActions}>
            <Button type="button" variant="outline" onClick={onClose} className={styles.closeButton}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={styles.primaryButton}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
