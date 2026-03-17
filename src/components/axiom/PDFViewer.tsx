import { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import type { AxiomInstance } from "@/hooks/useAxiomEngine";

interface PDFViewerProps {
  instance: AxiomInstance | null;
  onUpload: (file: File) => void;
}

export function PDFViewer({ instance, onUpload }: PDFViewerProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") onUpload(file);
    },
    [onUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const triggerFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onUpload(file);
    };
    input.click();
  };

  if (!instance) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`h-full flex flex-col items-center justify-center bg-background border-r border-border transition-colors duration-200 ${
          isDragging ? "bg-ai-surface" : ""
        }`}
      >
        <div
          onClick={triggerFileSelect}
          className={`border-2 border-dashed p-16 cursor-pointer transition-colors duration-200 group ${
            isDragging ? "border-ai-active" : "border-border hover:border-foreground"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <Upload
              size={24}
              className={`transition-colors ${isDragging ? "text-ai-active" : "text-muted-foreground group-hover:text-foreground"}`}
            />
            <div className="text-center">
              <div className="font-geist-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Drop PDF or Click
              </div>
              <div className="font-geist-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mt-2">
                Autonomous AI synthesis begins on upload
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border relative min-h-0">
      {/* Status Bar */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="font-geist-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground truncate mr-4">
          Source: {instance.fileName}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {instance.status === "scanning" && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-ai-active animate-pulse" />
              <span className="font-geist-mono text-[10px] uppercase tracking-wider text-ai-active">
                AI Processing P{instance.currentPage}/{instance.totalPages}
              </span>
            </div>
          )}
          {instance.status === "complete" && (
            <span className="font-geist-mono text-[10px] uppercase tracking-wider text-foreground">
              Synthesis Complete
            </span>
          )}
          {instance.status === "error" && (
            <span className="font-geist-mono text-[10px] uppercase tracking-wider text-destructive">
              Error
            </span>
          )}
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 relative min-h-0 overflow-auto">
        {instance.fileUrl ? (
          <iframe
            src={instance.fileUrl}
            title="PDF Viewer"
            className="w-full h-full border-0"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="font-geist-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Derived Instance — No Source Document
            </div>
          </div>
        )}

        {/* Scanning Beam */}
        <AnimatePresence>
          {instance.status === "scanning" && (
            <motion.div
              key="beam"
              initial={{ top: "0%" }}
              animate={{
                top: `${((instance.currentPage - 1) / instance.totalPages) * 100}%`,
              }}
              transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
              className="absolute left-0 right-0 h-[2px] bg-ai-active pointer-events-none z-10"
              style={{
                boxShadow:
                  "0 0 15px hsl(215 100% 50%), 0 0 40px hsl(215 100% 50% / 0.3)",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Page Progress */}
      <div className="p-3 border-t border-border flex gap-1 shrink-0">
        {instance.summaries.map((s) => (
          <div
            key={s.pageNumber}
            className={`flex-1 h-1.5 transition-colors duration-300 ${
              s.status === "complete"
                ? "bg-foreground"
                : s.status === "scanning"
                ? "bg-ai-active animate-pulse"
                : s.status === "error"
                ? "bg-destructive"
                : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
