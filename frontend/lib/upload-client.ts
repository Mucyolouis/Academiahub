export type UploadKind = "avatar" | "document";

export interface UploadResult {
  url: string;
  key: string;
  fileName: string;
  bytes: number;
}

export function uploadFileWithProgress(
  file: File,
  kind: UploadKind,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("kind", kind);
    body.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResult);
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        let message = "Upload failed";
        try {
          const data = JSON.parse(xhr.responseText);
          message = data?.error || message;
        } catch {}
        reject(new Error(message));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload")),
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(body);
  });
}
