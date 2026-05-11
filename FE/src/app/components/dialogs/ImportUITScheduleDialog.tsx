import { useState } from "react";
import { Info, Upload } from "lucide-react";

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
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import styles from "./ImportUITScheduleDialog.module.css";

type ImportMode = "replace" | "append";

interface ImportUITScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (result: UITScheduleImportResult, mode: ImportMode) => void;
}

export function ImportUITScheduleDialog({
  open,
  onOpenChange,
  onImport,
}: ImportUITScheduleDialogProps) {
  const [rawText, setRawText] = useState("");
  const [clipboardHtml, setClipboardHtml] = useState<string | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const preview = parseUITScheduleInput({ text: rawText, html: clipboardHtml });

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRawText("");
      setClipboardHtml(null);
      setFeedback(null);
    }

    onOpenChange(nextOpen);
  };

  const handleImport = () => {
    const result = parseUITScheduleInput({ text: rawText, html: clipboardHtml });

    if (!result.subjects.length) {
      setFeedback(result.warnings[0] || "The pasted content could not be imported.");
      return;
    }

    onImport(result, replaceExisting ? "replace" : "append");
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
                  Copy your personal schedule table from UIT Student and paste it here.
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
                <li>Select the personal schedule table and copy it.</li>
                <li>Paste it here with `Ctrl + V`.</li>
              </ol>
            </div>

            <div className={styles.field}>
              <Label htmlFor="uit-raw-input">Pasted data from UIT Student</Label>
              <Textarea
                id="uit-raw-input"
                value={rawText}
                onChange={(event) => {
                  setRawText(event.target.value);
                  setFeedback(null);
                }}
                onPaste={(event) => {
                  setClipboardHtml(event.clipboardData.getData("text/html") || null);
                }}
                placeholder="Paste the full timetable table here..."
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
