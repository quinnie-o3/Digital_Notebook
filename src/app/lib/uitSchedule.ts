import { Subject } from "../types";

export const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const UIT_PERIOD_SLOTS = [
  { period: 1, start: "07:30", end: "08:15" },
  { period: 2, start: "08:15", end: "09:00" },
  { period: 3, start: "09:00", end: "09:45" },
  { period: 4, start: "10:00", end: "10:45" },
  { period: 5, start: "10:45", end: "11:30" },
  { period: 6, start: "13:00", end: "13:45" },
  { period: 7, start: "13:45", end: "14:30" },
  { period: 8, start: "14:30", end: "15:15" },
  { period: 9, start: "15:30", end: "16:15" },
  { period: 10, start: "16:15", end: "17:00" },
  { period: 11, start: "17:45", end: "18:30" },
  { period: 12, start: "18:30", end: "19:15" },
  { period: 13, start: "19:15", end: "20:00" },
  { period: 14, start: "20:00", end: "20:45" },
];

const IMPORT_COLORS = [
  "#FFD8E6",
  "#D8E8FF",
  "#DFF6DD",
  "#FFF1C9",
  "#E8DAFF",
  "#FFDCC8",
  "#D7F6F0",
  "#F8DFF3",
];

const HEADER_PATTERNS = {
  code: ["ma mon", "ma hp", "ma hoc phan", "ma lop", "ma lop hp", "ma mh"],
  name: ["ten mon", "mon hoc", "hoc phan", "ten hoc phan"],
  day: ["thu", "ngay hoc"],
  room: ["phong", "phong hoc", "phong lt", "phong th"],
  startPeriod: ["tiet bd", "tiet bat dau", "bat dau tiet", "tiet dau"],
  endPeriod: ["tiet kt", "tiet ket thuc", "ket thuc tiet", "tiet cuoi"],
  periodCount: ["so tiet", "tong tiet", "so tiet hoc"],
  time: ["gio hoc", "thoi gian"],
  note: ["ghi chu", "hinh thuc", "tuan", "thu ghi chu"],
  startDate: ["bd", "bat dau"],
  endDate: ["kt", "ket thuc"],
};

const PERIOD_OR_TIME_HINT_PATTERN = /\b(thu|chu nhat|cn|tiet|gio|phong|bd|kt)\b|:\d{2}/i;
const RANGE_SEPARATOR_PATTERN = "[-\\u2013]";
const ALT_WEEK_PATTERN = /\b(?:ht1|ht2|cach 2 tuan)\b/i;

export interface UITScheduleImportResult {
  subjects: Subject[];
  warnings: string[];
}

export function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeToken(value: string) {
  return normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value: string) {
  return normalizeToken(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function pickColor(seed: string) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return IMPORT_COLORS[total % IMPORT_COLORS.length];
}

function createImportedSubjectId(input: {
  name: string;
  day: number;
  startTime: string;
  endTime: string;
  room?: string;
  courseCode?: string;
}) {
  return [
    slugify(input.courseCode || input.name),
    input.day,
    input.startTime.replace(":", ""),
    input.endTime.replace(":", ""),
    slugify(input.room || "no-room"),
  ].join("-");
}

function isDateLike(value: string) {
  return /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(value);
}

function parseRoomValue(cells: string[]) {
  return cells.find((cell) => /\b(?:P\s*)?[ABCE]\d{1,2}\.\d+\b/i.test(cell));
}

function parseCourseCode(cells: string[]) {
  return cells.find((cell) => /^[A-Z]{2,}[A-Z0-9.-]*\d+[A-Z0-9.-]*$/i.test(cell));
}

function parseDayValue(value: string) {
  const normalized = normalizeToken(value);

  if (!normalized) return null;
  if (normalized.includes("chu nhat") || normalized === "cn") return 6;

  const explicitMatch = normalized.match(/thu\s*([2-7])/);
  if (explicitMatch) return Number(explicitMatch[1]) - 2;

  if (/^[2-7]$/.test(normalized)) return Number(normalized) - 2;

  return null;
}

function parsePeriodNumber(value: string) {
  const match = normalizeToken(value).match(/\b(1[0-4]|[1-9])\b/);
  return match ? Number(match[1]) : null;
}

function parsePeriodRange(value: string) {
  const normalized = normalizeToken(value);
  const rangeMatch = normalized.match(
    new RegExp(`\\b(1[0-4]|[1-9])\\s*${RANGE_SEPARATOR_PATTERN}\\s*(1[0-4]|[1-9])\\b`),
  );

  if (rangeMatch) {
    return { start: Number(rangeMatch[1]), end: Number(rangeMatch[2]) };
  }

  const allNumbers = Array.from(normalized.matchAll(/\b(1[0-4]|[1-9])\b/g)).map((match) =>
    Number(match[1]),
  );

  if (allNumbers.length >= 2 && /[,;]/.test(normalized)) {
    return { start: Math.min(...allNumbers), end: Math.max(...allNumbers) };
  }

  return null;
}

function getTimeRangeFromPeriods(startPeriod: number, endPeriod: number) {
  const startSlot = UIT_PERIOD_SLOTS.find((slot) => slot.period === startPeriod);
  const endSlot = UIT_PERIOD_SLOTS.find((slot) => slot.period === endPeriod);

  if (!startSlot || !endSlot) return null;

  return {
    startTime: startSlot.start,
    endTime: endSlot.end,
  };
}

function parseTimeRange(value: string) {
  const match = value.match(
    new RegExp(
      `\\b([01]?\\d|2[0-3]):([0-5]\\d)\\s*${RANGE_SEPARATOR_PATTERN}\\s*([01]?\\d|2[0-3]):([0-5]\\d)\\b`,
    ),
  );

  if (!match) return null;

  return {
    startTime: `${match[1].padStart(2, "0")}:${match[2]}`,
    endTime: `${match[3].padStart(2, "0")}:${match[4]}`,
  };
}

function findColumnIndex(headers: string[], patterns: string[]) {
  return headers.findIndex((header) => patterns.some((pattern) => header.includes(pattern)));
}

function extractRowsFromHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"))
    .map((table) =>
      Array.from(table.querySelectorAll("tr"))
        .map((row) =>
          Array.from(row.querySelectorAll("th,td"))
            .map((cell) => normalizeWhitespace(cell.textContent || ""))
            .filter(Boolean),
        )
        .filter((row) => row.length > 0),
    )
    .filter((table) => table.length > 0);

  if (!tables.length) return [];

  const scoredTables = tables
    .map((table) => ({
      table,
      score: table.reduce((score, row) => {
        const rowText = normalizeToken(row.join(" "));
        if (PERIOD_OR_TIME_HINT_PATTERN.test(rowText)) {
          return score + 1;
        }
        return score;
      }, 0),
    }))
    .sort((left, right) => right.score - left.score);

  return scoredTables[0]?.table ?? [];
}

function extractRowsFromText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const rows = lines.map((line) => {
    if (line.includes("\t")) {
      return line.split("\t").map((cell) => normalizeWhitespace(cell));
    }

    if (line.includes("|")) {
      return line
        .split("|")
        .map((cell) => normalizeWhitespace(cell))
        .filter(Boolean);
    }

    return line
      .split(/\s{2,}/)
      .map((cell) => normalizeWhitespace(cell))
      .filter(Boolean);
  });

  return rows.filter((row) => row.length > 0);
}

function looksLikeHeader(row: string[]) {
  const normalizedRow = row.map((cell) => normalizeToken(cell));
  let score = 0;

  for (const cell of normalizedRow) {
    if (
      HEADER_PATTERNS.code.some((pattern) => cell.includes(pattern)) ||
      HEADER_PATTERNS.name.some((pattern) => cell.includes(pattern)) ||
      HEADER_PATTERNS.room.some((pattern) => cell.includes(pattern)) ||
      HEADER_PATTERNS.startPeriod.some((pattern) => cell.includes(pattern)) ||
      HEADER_PATTERNS.endPeriod.some((pattern) => cell.includes(pattern)) ||
      HEADER_PATTERNS.periodCount.some((pattern) => cell.includes(pattern)) ||
      HEADER_PATTERNS.day.some((pattern) => cell.includes(pattern))
    ) {
      score += 1;
    }
  }

  return score >= 2;
}

function guessSubjectName(row: string[], excludedIndexes: Set<number>) {
  const candidates = row.filter((cell, index) => {
    if (excludedIndexes.has(index)) return false;
    if (!cell) return false;
    if (isDateLike(cell)) return false;
    if (parseTimeRange(cell)) return false;
    if (parsePeriodRange(cell)) return false;
    if (parseDayValue(cell) !== null) return false;
    if (/^(lt|th|bt|pm|clc|ht1|ht2)$/i.test(cell)) return false;
    if (/^\d+$/.test(cell)) return false;
    return cell.length >= 4;
  });

  return candidates.sort((left, right) => right.length - left.length)[0];
}

function buildSubjectFromRow(row: string[], headers: string[]) {
  const codeIndex = findColumnIndex(headers, HEADER_PATTERNS.code);
  const nameIndex = findColumnIndex(headers, HEADER_PATTERNS.name);
  const dayIndex = findColumnIndex(headers, HEADER_PATTERNS.day);
  const roomIndex = findColumnIndex(headers, HEADER_PATTERNS.room);
  const startPeriodIndex = findColumnIndex(headers, HEADER_PATTERNS.startPeriod);
  const endPeriodIndex = findColumnIndex(headers, HEADER_PATTERNS.endPeriod);
  const periodCountIndex = findColumnIndex(headers, HEADER_PATTERNS.periodCount);
  const timeIndex = findColumnIndex(headers, HEADER_PATTERNS.time);
  const noteIndex = findColumnIndex(headers, HEADER_PATTERNS.note);
  const startDateIndex = findColumnIndex(headers, HEADER_PATTERNS.startDate);
  const endDateIndex = findColumnIndex(headers, HEADER_PATTERNS.endDate);

  const excludedIndexes = new Set<number>(
    [
      codeIndex,
      dayIndex,
      roomIndex,
      startPeriodIndex,
      endPeriodIndex,
      periodCountIndex,
      timeIndex,
      noteIndex,
      startDateIndex,
      endDateIndex,
    ].filter((index) => index >= 0),
  );

  const name = (nameIndex >= 0 ? row[nameIndex] : undefined) || guessSubjectName(row, excludedIndexes);
  const dayRaw =
    (dayIndex >= 0 ? row[dayIndex] : undefined) || row.find((cell) => parseDayValue(cell) !== null);
  const room = (roomIndex >= 0 ? row[roomIndex] : undefined) || parseRoomValue(row);
  const courseCode = (codeIndex >= 0 ? row[codeIndex] : undefined) || parseCourseCode(row);
  const note =
    noteIndex >= 0 ? row[noteIndex] : row.find((cell) => ALT_WEEK_PATTERN.test(normalizeToken(cell)));
  const startDate = startDateIndex >= 0 && isDateLike(row[startDateIndex]) ? row[startDateIndex] : undefined;
  const endDate = endDateIndex >= 0 && isDateLike(row[endDateIndex]) ? row[endDateIndex] : undefined;
  const day = dayRaw ? parseDayValue(dayRaw) : null;

  let timeRange =
    (timeIndex >= 0 ? parseTimeRange(row[timeIndex]) : null) ||
    row.map((cell) => parseTimeRange(cell)).find(Boolean) ||
    null;

  if (!timeRange) {
    const explicitRange = row.map((cell) => parsePeriodRange(cell)).find(Boolean) || null;
    const startPeriod =
      (startPeriodIndex >= 0 ? parsePeriodNumber(row[startPeriodIndex]) : null) ||
      explicitRange?.start ||
      null;
    const endPeriodFromRow = endPeriodIndex >= 0 ? parsePeriodNumber(row[endPeriodIndex]) : null;
    const periodCount = periodCountIndex >= 0 ? parsePeriodNumber(row[periodCountIndex]) : null;
    const endPeriod =
      explicitRange?.end ||
      endPeriodFromRow ||
      (startPeriod && periodCount ? startPeriod + periodCount - 1 : null);

    if (startPeriod && endPeriod) {
      timeRange = getTimeRangeFromPeriods(startPeriod, endPeriod);
    }
  }

  if (!name || day === null || !timeRange) {
    return null;
  }

  const trimmedName = name.replace(/\s+\((LT|TH|BT)\)$/i, "").trim();

  return {
    id: createImportedSubjectId({
      name: trimmedName,
      day,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      room,
      courseCode,
    }),
    name: trimmedName,
    color: pickColor(courseCode || trimmedName),
    day,
    startTime: timeRange.startTime,
    endTime: timeRange.endTime,
    room,
    courseCode,
    source: "uit" as const,
    note,
    startDate,
    endDate,
  };
}

export function parseUITScheduleInput(input: {
  text: string;
  html?: string | null;
}): UITScheduleImportResult {
  const rowsFromHtml = input.html ? extractRowsFromHtml(input.html) : [];
  const rows = rowsFromHtml.length ? rowsFromHtml : extractRowsFromText(input.text);
  const warnings: string[] = [];

  if (!rows.length) {
    return {
      subjects: [],
      warnings: ["No schedule table was detected in the pasted content."],
    };
  }

  const headerRowIndex = looksLikeHeader(rows[0]) ? 0 : -1;
  const headers = (headerRowIndex >= 0 ? rows[headerRowIndex] : rows[0].map(() => "")).map((cell) =>
    normalizeToken(cell),
  );
  const dataRows = rows.slice(headerRowIndex >= 0 ? headerRowIndex + 1 : 0);

  const parsedSubjects = dataRows
    .map((row) => buildSubjectFromRow(row, headers))
    .filter((subject): subject is Subject => Boolean(subject));

  const uniqueSubjects = Array.from(
    new Map(parsedSubjects.map((subject) => [subject.id, subject])).values(),
  );

  if (!uniqueSubjects.length) {
    warnings.push(
      "No classes could be parsed. Copy the schedule table directly from UIT Student and try again.",
    );
  }

  if (uniqueSubjects.some((subject) => ALT_WEEK_PATTERN.test(normalizeToken(subject.note || "")))) {
    warnings.push(
      "Some classes mention alternate-week schedules. They were imported, but even/odd week handling is not implemented yet.",
    );
  }

  if (uniqueSubjects.some((subject) => minutesFromTime(subject.startTime) >= minutesFromTime("17:45"))) {
    warnings.push("Evening classes were mapped into the 17:45 - 20:45 time range.");
  }

  return {
    subjects: uniqueSubjects.sort((left, right) => {
      if (left.day !== right.day) return left.day - right.day;
      return minutesFromTime(left.startTime) - minutesFromTime(right.startTime);
    }),
    warnings,
  };
}
