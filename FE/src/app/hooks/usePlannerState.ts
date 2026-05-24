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

export function usePlannerState() {
  const [bootstrap] = useState(loadInitialPlannerState);
  const [subjects, setSubjects] = useState<Subject[]>(bootstrap.subjects);
  const [assignments, setAssignments] = useState<Assignment[]>(bootstrap.assignments);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

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

    setSelectedSubject(nextSelectedSubject);
  }, [selectedSubject, subjects]);

  const handleAddSubject = async (subjectData: Omit<Subject, "id">) => {
    const newSubject = await createCourseInOracle(subjectData);

    setSubjects((previous) => [...previous, newSubject]);
    setAssignments((previous) => [...previous, createDefaultAssignment(newSubject.id)]);
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
    handleOpenNotebook,
    handleSaveAssignment,
    importFeedback,
    isAddDialogOpen,
    isImportDialogOpen,
    isNotebookOpen,
    selectedSubject,
    setIsAddDialogOpen,
    setIsImportDialogOpen,
    setIsNotebookOpen,
    subjects,
  };
}
