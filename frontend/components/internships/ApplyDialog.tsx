"use client";

import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApplyToInternship } from "@/lib/internships/hooks";

interface StoredResume {
  url: string;
  fileName: string;
}

export default function ApplyDialog({
  internshipId,
  onClose,
}: {
  internshipId: string;
  onClose?: () => void;
}) {
  const apply = useApplyToInternship();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<StoredResume | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleClose = (openNext: boolean) => {
    setOpen(openNext);
    if (!openNext) onClose?.();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !["application/pdf", "application/msword"].includes(file.type) &&
      !file.name.toLowerCase().endsWith(".docx") &&
      !file.name.toLowerCase().endsWith(".pdf") &&
      !file.name.toLowerCase().endsWith(".doc")
    ) {
      toast.error("Please upload a PDF or Word document");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume must be 5MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("kind", "resume");
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setResume({ url: data.url, fileName: data.fileName });
      toast.success("Resume uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!coverLetter.trim()) {
      toast.error("A cover letter is required");
      return;
    }
    apply.mutate(
      {
        internshipId,
        coverLetter: coverLetter.trim(),
        resumeUrl: resume?.url,
        resumeName: resume?.fileName,
      },
      {
        onSuccess: () => {
          toast.success("Application submitted!");
          handleClose(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="h-auto max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for this internship</DialogTitle>
          <DialogDescription>
            Introduce yourself. Adding a resume increases your chances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cv">Cover letter *</Label>
            <Textarea
              id="cv"
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Why are you a great fit for this role?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Resume (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {resume ? "Replace resume" : "Upload resume"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                className="hidden"
                onChange={handleFile}
              />
              {resume ? (
                <span className="text-xs text-gray-500 truncate">
                  {resume.fileName}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-400">
              PDF or Word, up to 5MB.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={apply.isPending}>
            {apply.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Submit application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}