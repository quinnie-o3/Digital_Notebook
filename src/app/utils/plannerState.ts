import { INITIAL_SUBJECTS } from "../constants/initialSubjects";
import { Assignment, Subject } from "../types";

export const STORAGE_KEY = "digital-student-planner:v2";

export interface PlannerBootstrapState {
  subjects: Subject[];
  assignments: Assignment[];
}

export const createDefaultAssignment = (subjectId: string): Assignment => ({
  id: `assignment-${subjectId}`,
  subjectId,
  lessonNotes: "",
  homework: [],
  deadline: "",
});

export const buildAssignmentsForSubjects = (
  subjects: Subject[],
  assignments: Assignment[] = [],
) =>
  subjects.map(
    (subject) =>
      assignments.find((assignment) => assignment.subjectId === subject.id) ||
      createDefaultAssignment(subject.id),
  );

export const mergeSubjectsById = (subjects: Subject[]) =>
  Array.from(new Map(subjects.map((subject) => [subject.id, subject])).values());

function createDefaultBootstrapState(): PlannerBootstrapState {
  return {
    subjects: INITIAL_SUBJECTS,
    assignments: buildAssignmentsForSubjects(INITIAL_SUBJECTS),
  };
}

export function loadInitialPlannerState(): PlannerBootstrapState {
  if (typeof window === "undefined") {
    return createDefaultBootstrapState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createDefaultBootstrapState();
    }

    const parsed = JSON.parse(raw) as {
      subjects?: Subject[];
      assignments?: Assignment[];
    };

    const subjects = parsed.subjects?.length ? parsed.subjects : INITIAL_SUBJECTS;
    const assignments = buildAssignmentsForSubjects(subjects, parsed.assignments);

    return { subjects, assignments };
  } catch {
    return createDefaultBootstrapState();
  }
}
