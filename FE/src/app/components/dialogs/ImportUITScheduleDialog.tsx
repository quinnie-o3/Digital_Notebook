import { useState } from "react";
import { FileText, Info, Upload } from "lucide-react";

import { parseUITScheduleInput, UITScheduleImportResult } from "../../lib/uitSchedule";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import styles from "./ImportUITScheduleDialog.module.css";

type ImportMode = "replace" | "append";
const UIT_CALENDAR_EXTENSIONS = [".ics", ".isc"];

interface ImportUITScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (result: UITScheduleImportResult, mode: ImportMode, sourceText: string) => void;
}

export function ImportUITScheduleDialog({
  open,
  onOpenChange,
  onImport,
}: ImportUITScheduleDialogProps) {
  const [rawText, setRawText] = useState("");
  const [clipboardHtml, setClipboardHtml] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const preview = parseUITScheduleInput({ text: rawText, html: clipboardHtml });

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRawText("");
      setClipboardHtml(null);
      setSelectedFileName(null);
      setFeedback(null);
    }

    onOpenChange(nextOpen);
  };

  const handleFileChange = (file: File | undefined) => {
    setFeedback(null);
    setClipboardHtml(null);

    if (!file) {
      setSelectedFileName(null);
      setRawText("");
      return;
    }

    const fileName = file.name.toLowerCase();
    const isCalendarFile =
      UIT_CALENDAR_EXTENSIONS.some((extension) => fileName.endsWith(extension)) ||
      file.type === "text/calendar";

    if (!isCalendarFile) {
      setSelectedFileName(null);
      setFeedback("Please choose a .ics or .isc calendar file exported from UIT Student.");
      return;
    }

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setRawText(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      setFeedback("The calendar file could not be read. Please try exporting it again.");
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const result = parseUITScheduleInput({ text: rawText, html: clipboardHtml });

    if (!result.subjects.length) {
      setFeedback(result.warnings[0] || "The pasted content could not be imported.");
      return;
    }

    onImport(result, replaceExisting ? "replace" : "append", rawText);
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={styles.content}>
        <div className={styles.panel}>
          <DialogHeader className={styles.header}>
            <div className={styles.headerRow}>
              <div className={styles.iconWrap}>
                <Upload className="size-5" />
              </div>
              <div>
                <DialogTitle>Import from UIT Student</DialogTitle>
                <DialogDescription className={styles.description}>
                  Upload the .ics or .isc timetable file exported from UIT Student.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className={styles.body}>
            <div className={styles.infoBox}>
              <div className={styles.infoTitle}>
                <Info className="size-4" />
                How to get the data
              </div>
              <ol className={styles.infoList}>
                <li>Sign in to `student.uit.edu.vn`.</li>
                <li>Open the timetable page in your UIT Student portal.</li>
                <li>Download or export the timetable as an `.ics` or `.isc` calendar file.</li>
                <li>Choose that file below, then import it into this planner.</li>
              </ol>
            </div>

            <div className={styles.field}>
              <Label htmlFor="uit-ics-file">UIT Student calendar file</Label>
              <div className={styles.fileBox}>
                <div className={styles.fileIcon}>
                  <FileText className="size-5" />
                </div>
                <div className={styles.fileBody}>
                  <Input
                    id="uit-ics-file"
                    type="file"
                    accept=".ics,.isc,text/calendar"
                    onChange={(event) => handleFileChange(event.target.files?.[0])}
                    className={styles.fileInput}
                  />
                  {selectedFileName ? (
                    <p className={styles.fileName}>{selectedFileName}</p>
                  ) : (
                    <p className={styles.fileHint}>Choose the .ics or .isc file downloaded from UIT Student.</p>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <Label htmlFor="uit-raw-input">Raw calendar text fallback</Label>
              <Textarea
                id="uit-raw-input"
                value={rawText}
                onChange={(event) => {
                  setRawText(event.target.value);
                  setSelectedFileName(null);
                  setFeedback(null);
                }}
                onPaste={(event) => {
                  setClipboardHtml(event.clipboardData.getData("text/html") || null);
                }}
                placeholder="Optional: paste the calendar file content here if file upload is not available..."
                className={styles.textarea}
              />
            </div>

            <div className={styles.modeBox}>
              <Checkbox
                checked={replaceExisting}
                onCheckedChange={(checked) => setReplaceExisting(Boolean(checked))}
                className={styles.checkbox}
              />
              <div>
                <Label className={styles.modeLabel}>Replace the current schedule</Label>
                <p className={styles.modeText}>
                  Turn this off if you want to append the imported classes instead.
                </p>
              </div>
            </div>

            <div className={styles.previewBox}>
              <div className={styles.previewTitle}>
                Preview: {preview.subjects.length} classes will be imported
              </div>

              {preview.subjects.length > 0 ? (
                <div className={styles.previewChips}>
                  {preview.subjects.slice(0, 6).map((subject) => (
                    <span key={subject.id} className={styles.previewChip}>
                      {subject.name} - {subject.startTime}
                    </span>
                  ))}
                  {preview.subjects.length > 6 ? (
                    <span className={styles.previewChip}>
                      +{preview.subjects.length - 6} more
                    </span>
                  ) : null}
                </div>
              ) : null}

              {preview.warnings.length > 0 ? (
                <div className={styles.warnings}>
                  {preview.warnings.map((warning) => (
                    <p key={warning}>- {warning}</p>
                  ))}
                </div>
              ) : null}

              {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
            </div>
          </div>

          <DialogFooter className={styles.footer}>
            <Button variant="outline" onClick={() => handleClose(false)} className={styles.cancelButton}>
              Cancel
            </Button>
            <Button onClick={handleImport} className={styles.submitButton}>
              Import schedule
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
