"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  documentId: string;
  fileUrl: string;
  fileName: string;
  onDownload?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Build a URL that forces a browser download with a clean filename.
 * Locally stored files are served through /api/files and support a
 * `download=1&name=` query. Cloudinary URLs (legacy rows) fall back to the
 * `fl_attachment` rewrite.
 */
function buildDownloadUrl(fileUrl: string, fileName: string): string {
  const baseName = fileName.replace(/\.pdf$/i, "").trim() || "document";
  const encoded = encodeURIComponent(baseName);

  if (fileUrl.startsWith("/api/files/")) {
    const separator = fileUrl.includes("?") ? "&" : "?";
    return `${fileUrl}${separator}download=1&name=${encoded}`;
  }

  const marker = "/upload/";
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return fileUrl;
  return (
    fileUrl.slice(0, idx + marker.length) +
    `fl_attachment:${encoded}/` +
    fileUrl.slice(idx + marker.length)
  );
}

const DownloadButton = ({
  documentId,
  fileUrl,
  fileName,
  onDownload,
  className,
  children,
}: DownloadButtonProps) => {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);

    try {
      // Trigger the download via Cloudinary's attachment URL. The browser
      // handles it natively (Content-Disposition), so there's no cross-origin
      // fetch/blob/CORS round-trip to fail. target=_blank keeps the page intact
      // even if the attachment header is ever missing.
      const link = document.createElement("a");
      link.href = buildDownloadUrl(fileUrl, fileName);
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Record the download separately; only bump the optimistic counter if it
      // was actually recorded.
      const response = await fetch(`/api/documents/${documentId}/download`, {
        method: "POST",
      });
      if (response.ok) onDownload?.();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="default"
      size="lg"
      className={
        className ??
        "basis-full rounded h-7.5 md:h-11 flex items-center justify-center text-[7.77px] font-medium md:text-[16px] leading-[130%]"
      }
      onClick={handleDownload}
      disabled={loading}
    >
      {children ?? "Download Publication"}
    </Button>
  );
};

export default DownloadButton;
