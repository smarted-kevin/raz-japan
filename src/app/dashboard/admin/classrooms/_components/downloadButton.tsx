"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "~/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface DownloadButtonProps {
  classroomId: string;
  classroomName: string;
}

export default function DownloadButton({
  classroomId,
  classroomName,
}: DownloadButtonProps) {
  const t = useTranslations("dashboard.admin.classrooms");
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/export/classroom/${classroomId}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `${classroomName}_export.csv`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename ?? "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert(t("download_failed"));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      className="h-8 w-8 p-0"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
