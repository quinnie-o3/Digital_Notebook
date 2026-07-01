import { useEffect, useState } from "react";

import {
  createCourseInOracle,
  getAssignmentForSessionFromOracle,
  getPlannerStateFromOracle,
  importScheduleToOracle,
  saveAssignmentToOracle,
} from "../lib/plannerApi";
import { UITScheduleImportResult } from "../lib/uitSchedule";
import { Assignment, Subject } from "../types";
import {
  buildAssignmentsForSubjects,
  createDefaultAssignment,
  loadInitialPlannerState,
} from "../utils/plannerState";

const WEEK_LENGTH_DAYS = 7;

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  return new Date(`${value}T00:00:00`);
}

function isValidDateInputValue(value: string) {
  return Boolean(value) && !Number.isNaN(parseDateInputValue(value).getTime());
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

function getDateForWeekday(weekStart: Date, dayIndex: number) {
  return addDays(weekStart, dayIndex);
}

function isSameWeek(firstDate: Date, secondDate: Date) {
  return formatDateInputValue(getWeekStart(firstDate)) === formatDateInputValue(getWeekStart(secondDate));
}

function isSubjectVisibleInWeek(subject: Subject, selectedDate: string) {
  if (!subject.startDate && !subject.endDate) {
    return isSameWeek(parseDateInputValue(selectedDate), new Date());
  }

  const weekStart = getWeekStart(parseDateInputValue(selectedDate));
  const occurrenceDate = getDateForWeekday(weekStart, subject.day);
  const occurrenceDateText = formatDateInputValue(occurrenceDate);

  if (subject.startDate && occurrenceDateText < subject.startDate) {
    return false;
  }

  if (subject.endDate && occurrenceDateText > subject.endDate) {
    return false;
  }

  return true;
}

function buildWeekLabel(selectedDate: string) {
  const weekStart = getWeekStart(parseDateInputValue(selectedDate));
  const weekEnd = addDays(weekStart, WEEK_LENGTH_DAYS - 1);
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
}

export function usePlannerState() {
  const [bootstrap] = useState(loadInitialPlannerState);
  const [subjects, setSubjects] = useState<Subject[]>(bootstrap.subjects);
  const [assignments, setAssignments] = useState<Assignment[]>(bootstrap.assignments);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDateInputValue(new Date()));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isPlannerHydrated, setIsPlannerHydrated] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const visibleSubjects = subjects.filter((subject) => isSubjectVisibleInWeek(subject, selectedDate));
  const selectedWeekLabel = buildWeekLabel(selectedDate);

  useEffect(() => {
    let isCancelled = false;

    const hydratePlannerFromDatabase = async () => {
      try {
        const databaseState = await getPlannerStateFromOracle();

        if (isCancelled) {
          return;
        }

        if (databaseState.subjects.length > 0) {
          setSubjects(databaseState.subjects);
          setAssignments(buildAssignmentsForSubjects(databaseState.subjects, databaseState.assignments));
        }
      } catch (error) {
        console.error("Failed to hydrate planner data from Oracle.", error);
      } finally {
        if (!isCancelled) {
          setIsPlannerHydrated(true);
        }
      }
    };

    void hydratePlannerFromDatabase();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      return;
    }

    const nextSelectedSubject =
      subjects.find((subject) => subject.id === selectedSubject.id) || null;

    if (!nextSelectedSubject || !isSubjectVisibleInWeek(nextSelectedSubject, selectedDate)) {
      setSelectedSubject(null);
      setIsNotebookOpen(false);
      return;
    }

    setSelectedSubject(nextSelectedSubject);
  }, [selectedDate, selectedSubject, subjects]);

  const handleAddSubject = async (subjectData: Omit<Subject, "id">) => {
    const newSubject = await createCourseInOracle(subjectData);

    setSubjects((previous) => [...previous, newSubject]);
    setAssignments((previous) => [...previous, createDefaultAssignment(newSubject.id)]);
  };

  const handleMoveWeek = (direction: -1 | 1) => {
    setSelectedDate((previous) =>
      formatDateInputValue(addDays(parseDateInputValue(previous), direction * WEEK_LENGTH_DAYS)),
    );
  };

  const handleSelectDate = (date: string) => {
    if (isValidDateInputValue(date)) {
      setSelectedDate(date);
    }
  };

  const handleSaveAssignment = async (assignment: Assignment) => {
    const savedAssignment = await saveAssignmentToOracle(assignment);

    setAssignments((previous) => {
      const hasExistingAssignment = previous.some((item) => item.subjectId === savedAssignment.subjectId);

      if (!hasExistingAssignment) {
        return [...previous, savedAssignment];
      }

      return previous.map((item) =>
        item.subjectId === savedAssignment.subjectId ? savedAssignment : item,
      );
    });
  };

  const handleOpenNotebook = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsNotebookOpen(true);

    void (async () => {
      try {
        const refreshedAssignment = await getAssignmentForSessionFromOracle(subject.id);

        setAssignments((previous) => {
          const hasExistingAssignment = previous.some(
            (assignment) => assignment.subjectId === refreshedAssignment.subjectId,
          );

          if (!hasExistingAssignment) {
            return [...previous, refreshedAssignment];
          }

          return previous.map((assignment) =>
            assignment.subjectId === refreshedAssignment.subjectId ? refreshedAssignment : assignment,
          );
        });
      } catch (error) {
        console.error("Failed to refresh notebook data.", error);
      }
    })();
  };

  const handleImportSchedule = (
    result: UITScheduleImportResult,
    mode: "replace" | "append",
    sourceText = "",
  ) => {
    void (async () => {
      try {
        setImportFeedback("Importing schedule from UIT Student...");
        await importScheduleToOracle(result.subjects, mode, sourceText);
        const databaseState = await getPlannerStateFromOracle();

        setSubjects(databaseState.subjects);
        setAssignments(buildAssignmentsForSubjects(databaseState.subjects, databaseState.assignments));

        if (
          selectedSubject &&
          !databaseState.subjects.some((subject) => subject.id === selectedSubject.id)
        ) {
          setSelectedSubject(null);
          setIsNotebookOpen(false);
        }

        setImportFeedback(
          result.warnings.length
            ? `Imported ${result.subjects.length} classes. Note: ${result.warnings.join(" ")}`
            : `Imported ${result.subjects.length} classes from UIT Student.`,
        );
      } catch (error) {
        console.error("Failed to import schedule.", error);
        setImportFeedback(
          error instanceof Error
            ? `Import failed: ${error.message}`
            : "Import failed. Please check that the backend is running and try again.",
        );
      }
    })();
  };

  const currentAssignment = selectedSubject
    ? assignments.find((assignment) => assignment.subjectId === selectedSubject.id) || null
    : null;

  return {
    assignments,
    currentAssignment,
    handleAddSubject,
    handleImportSchedule,
    handleMoveWeek,
    handleOpenNotebook,
    handleSaveAssignment,
    importFeedback,
    isAddDialogOpen,
    isImportDialogOpen,
    isNotebookOpen,
    isPlannerHydrated,
    selectedSubject,
    selectedDate,
    selectedWeekLabel,
    setSelectedDate: handleSelectDate,
    setIsAddDialogOpen,
    setIsImportDialogOpen,
    setIsNotebookOpen,
    subjects,
    visibleSubjects,
  };
}
