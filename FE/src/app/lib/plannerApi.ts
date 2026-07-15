import { Assignment, HomeworkItem, Subject } from "../types";
import { authFetch } from "./authApi";

interface ApiTimetable {
  timetableId: number;
  userId: number;
  name?: string | null;
  active?: number | null;
}

interface ApiSubject {
  subjectId: number;
  userId: number;
  subjectName: string;
  subjectCode?: string | null;
  colorCode?: string | null;
}

interface ApiClass {
  classId: number;
  timetableId: number;
  subjectId: number;
  teacherName?: string | null;
  defaultRoom?: string | null;
  createdType?: string | null;
}

interface ApiClassSession {
  sessionId: number;
  classId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface ApiLessonNote {
  noteId: number;
  sessionId: number;
  noteDate?: string | null;
  lessonSummary?: string | null;
  reviewNotes?: string | null;
}

interface ApiTask {
  taskId: number;
  noteId?: number | null;
  sessionId: number;
  title: string;
  description?: string | null;
  deadline?: string | null;
  status: "todo" | "doing" | "done" | "overdue";
  priority: "low" | "normal" | "high";
}

interface ApiImportFile {
  importId: number;
  userId: number;
  fileName: string;
  fileType?: string | null;
  fileUrl?: string | null;
  status: "uploaded" | "processing" | "completed" | "failed";
  errorMessage?: string | null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await authFetch(path, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function deleteRequest(path: string): Promise<void> {
  const response = await authFetch(path, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

function toSubject(session: ApiClassSession, classItem: ApiClass, subject: ApiSubject): Subject {
  return {
    id: String(session.sessionId),
    name: subject.subjectName,
    color: subject.colorCode || "#D8E8FF",
    day: Math.max(0, session.dayOfWeek - 1),
    startTime: session.startTime,
    endTime: session.endTime,
    room: session.room || classItem.defaultRoom || undefined,
    courseCode: subject.subjectCode || undefined,
    source: classItem.createdType === "import" ? "uit" : "manual",
    startDate: session.startDate?.slice(0, 10),
    endDate: session.endDate?.slice(0, 10),
  };
}

function toHomeworkItem(task: ApiTask): HomeworkItem {
  return {
    id: String(task.taskId),
    text: task.title,
    completed: task.status === "done",
  };
}

function toAssignment(session: ApiClassSession, notes: ApiLessonNote[], tasks: ApiTask[]): Assignment {
  const note = notes[0];
  const sessionTasks = tasks
    .filter((task) => task.sessionId === session.sessionId)
    .sort((firstTask, secondTask) => firstTask.taskId - secondTask.taskId);

  return {
    id: note ? String(note.noteId) : `assignment-${session.sessionId}`,
    subjectId: String(session.sessionId),
    lessonNotes: note?.lessonSummary || "",
    homework: sessionTasks.map(toHomeworkItem),
    deadline: sessionTasks.find((task) => task.deadline)?.deadline?.slice(0, 10) || "",
  };
}

async function getDefaultTimetable() {
  const timetables = await requestJson<ApiTimetable[]>("/api/timetables");
  const activeTimetable = timetables.find((timetable) => timetable.active === 1) || timetables[0];

  if (activeTimetable) {
    return activeTimetable;
  }

  return requestJson<ApiTimetable>("/api/timetables", {
    method: "POST",
    body: JSON.stringify({
      name: "My Timetable",
      active: 1,
    }),
  });
}

export async function getPlannerStateFromMongoDb() {
  const [subjects, timetables, classes, sessions, lessonNotes, tasks] = await Promise.all([
    requestJson<ApiSubject[]>("/api/subjects"),
    requestJson<ApiTimetable[]>("/api/timetables"),
    requestJson<ApiClass[]>("/api/classes"),
    requestJson<ApiClassSession[]>("/api/class-sessions"),
    requestJson<ApiLessonNote[]>("/api/lesson-notes"),
    requestJson<ApiTask[]>("/api/tasks"),
  ]);

  const subjectsById = new Map(subjects.map((subject) => [subject.subjectId, subject]));
  const timetableIds = new Set(timetables.map((timetable) => timetable.timetableId));
  const visibleClasses = classes.filter(
    (classItem) =>
      subjectsById.has(classItem.subjectId) || timetableIds.has(classItem.timetableId),
  );
  const classesById = new Map(visibleClasses.map((classItem) => [classItem.classId, classItem]));
  const visibleSessions = sessions.filter((session) => {
    const classItem = classesById.get(session.classId);
    return classItem && subjectsById.has(classItem.subjectId);
  });
  const sessionIds = new Set(visibleSessions.map((session) => session.sessionId));
  const visibleLessonNotes = lessonNotes.filter((note) => sessionIds.has(note.sessionId));
  const visibleTasks = tasks.filter((task) => sessionIds.has(task.sessionId));

  return {
    subjects: visibleSessions.map((session) => {
      const classItem = classesById.get(session.classId)!;
      return toSubject(session, classItem, subjectsById.get(classItem.subjectId)!);
    }),
    assignments: visibleSessions.map((session) =>
      toAssignment(
        session,
        visibleLessonNotes.filter((note) => note.sessionId === session.sessionId),
        visibleTasks,
      ),
    ),
  };
}

export async function getAssignmentForSessionFromMongoDb(subjectId: string) {
  const sessionId = Number(subjectId);
  const [session, lessonNotes, tasks] = await Promise.all([
    requestJson<ApiClassSession>(`/api/class-sessions/${sessionId}`),
    requestJson<ApiLessonNote[]>(`/api/lesson-notes/session/${sessionId}`),
    requestJson<ApiTask[]>(`/api/tasks/session/${sessionId}`),
  ]);

  return toAssignment(session, lessonNotes, tasks);
}

export async function createCourseInMongoDb(subjectData: Omit<Subject, "id">) {
  const timetable = await getDefaultTimetable();
  const subject = await requestJson<ApiSubject>("/api/subjects", {
    method: "POST",
    body: JSON.stringify({
      subjectName: subjectData.name,
      subjectCode: subjectData.courseCode,
      colorCode: subjectData.color,
    }),
  });
  const classItem = await requestJson<ApiClass>("/api/classes", {
    method: "POST",
    body: JSON.stringify({
      timetableId: timetable.timetableId,
      subjectId: subject.subjectId,
      defaultRoom: subjectData.room,
      createdType: subjectData.source === "uit" ? "import" : "manual",
    }),
  });
  const session = await requestJson<ApiClassSession>("/api/class-sessions", {
    method: "POST",
    body: JSON.stringify({
      classId: classItem.classId,
      dayOfWeek: subjectData.day + 1,
      startTime: subjectData.startTime,
      endTime: subjectData.endTime,
      room: subjectData.room,
      startDate: subjectData.startDate,
      endDate: subjectData.endDate,
    }),
  });

  return toSubject(session, classItem, subject);
}

async function deleteCurrentScheduleForUser() {
  const [userSubjects, timetables] = await Promise.all([
    requestJson<ApiSubject[]>("/api/subjects"),
    requestJson<ApiTimetable[]>("/api/timetables"),
  ]);

  await Promise.all(userSubjects.map((subject) => deleteRequest(`/api/subjects/${subject.subjectId}`)));
  await Promise.all(timetables.map((timetable) => deleteRequest(`/api/timetables/${timetable.timetableId}`)));
}

async function createImportRecord(sourceText: string) {
  return requestJson<ApiImportFile>("/api/import-files", {
    method: "POST",
    body: JSON.stringify({
      fileName: "UIT Student pasted schedule",
      fileType: "text/plain",
      fileUrl: null,
      status: "processing",
      errorMessage: sourceText ? null : "No raw source text captured.",
    }),
  });
}

async function completeImportRecord(importFile: ApiImportFile, status: "completed" | "failed", errorMessage?: string) {
  return requestJson<ApiImportFile>(`/api/import-files/${importFile.importId}`, {
    method: "PUT",
    body: JSON.stringify({
      ...importFile,
      status,
      errorMessage: errorMessage || null,
    }),
  });
}

async function createImportItems(importId: number, subjects: Omit<Subject, "id">[]) {
  await Promise.all(
    subjects.map((subject) =>
      requestJson("/api/import-items", {
        method: "POST",
        body: JSON.stringify({
          importId,
          rawText: [subject.courseCode, subject.name, subject.room, subject.startTime, subject.endTime]
            .filter(Boolean)
            .join(" | "),
          subjectName: subject.name,
          dayOfWeek: subject.day + 1,
          startTime: subject.startTime,
          endTime: subject.endTime,
          room: subject.room,
          confidenceScore: 100,
          status: "accepted",
        }),
      }),
    ),
  );
}

export async function importScheduleToMongoDb(
  subjects: Omit<Subject, "id">[],
  mode: "replace" | "append",
  sourceText: string,
) {
  const importFile = await createImportRecord(sourceText);

  try {
    if (mode === "replace") {
      await deleteCurrentScheduleForUser();
    }

    await getDefaultTimetable();
    await createImportItems(importFile.importId, subjects);
    await Promise.all(
      subjects.map((subject) =>
        createCourseInMongoDb({
          ...subject,
          source: "uit",
        }),
      ),
    );
    await completeImportRecord(importFile, "completed");
  } catch (error) {
    await completeImportRecord(
      importFile,
      "failed",
      error instanceof Error ? error.message : "Import failed.",
    );
    throw error;
  }
}

export async function saveAssignmentToMongoDb(assignment: Assignment) {
  const sessionId = Number(assignment.subjectId);
  const existingNotes = await requestJson<ApiLessonNote[]>(`/api/lesson-notes/session/${sessionId}`);
  const existingNote = existingNotes[0];
  const noteBody = {
    sessionId,
    lessonSummary: assignment.lessonNotes,
    reviewNotes: null,
  };
  const savedNote = await requestJson<ApiLessonNote>(
    existingNote ? `/api/lesson-notes/${existingNote.noteId}` : "/api/lesson-notes",
    {
      method: existingNote ? "PUT" : "POST",
      body: JSON.stringify({
        ...existingNote,
        ...noteBody,
      }),
    },
  );
  const existingTasks = await requestJson<ApiTask[]>(`/api/tasks/session/${sessionId}`);
  const existingTaskIds = new Set(existingTasks.map((task) => task.taskId));
  const keptTaskIds = new Set(
    assignment.homework
      .map((item) => Number(item.id))
      .filter((id) => Number.isInteger(id) && existingTaskIds.has(id)),
  );

  await Promise.all(
    existingTasks
      .filter((task) => !keptTaskIds.has(task.taskId))
      .map((task) => deleteRequest(`/api/tasks/${task.taskId}`)),
  );

  const savedTasks = await Promise.all(
    assignment.homework.map((item) => {
      const taskId = Number(item.id);
      const existingTask = existingTasks.find((task) => task.taskId === taskId);

      return requestJson<ApiTask>(existingTask ? `/api/tasks/${taskId}` : "/api/tasks", {
        method: existingTask ? "PUT" : "POST",
        body: JSON.stringify({
          ...existingTask,
          noteId: savedNote.noteId,
          sessionId,
          title: item.text,
          deadline: assignment.deadline ? `${assignment.deadline}T00:00:00` : null,
          status: item.completed ? "done" : "todo",
          priority: existingTask?.priority || "normal",
        }),
      });
    }),
  );

  return toAssignment({ sessionId, classId: 0, dayOfWeek: 1, startTime: "", endTime: "" }, [savedNote], savedTasks);
}
