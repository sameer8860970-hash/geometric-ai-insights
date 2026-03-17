import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import type { AxiomInstance } from "@/hooks/useAxiomEngine";

interface PDFViewerProps {
  instance: AxiomInstance | null;
  onUpload: (file: File) => void;
}

export function PDFViewer({ instance, onUpload }: PDFViewerProps) {
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") onUpload(file);
    },
    [onUpload]
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  if (!instance) {
    return (
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="h-full flex flex-col items-center justify-center bg-background border-r border-border"
      >
        <div
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".pdf";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) onUpload(file);
            };
            input.click();
          }}
          className="border-2 border-dashed border-border p-16 cursor-pointer hover:border-foreground transition-colors duration-200 group"
        >
          <div className="flex flex-col items-center gap-4">
            <Upload size={24} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <div className="text-center">
              <div className="font-geist-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Drop PDF or Click
              </div>
              <div className="font-geist-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mt-2">
                Autonomous synthesis begins on upload
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border relative">
      {/* Status Bar */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="font-geist-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Source: {instance.fileName}
        </div>
        <div className="flex items-center gap-3">
          {instance.status === "scanning" && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-ai-active animate-pulse" />
              <span className="font-geist-mono text-[10px] uppercase tracking-wider text-ai-active">
                Processing P{instance.currentPage}/{instance.totalPages}
              </span>
            </div>
          )}
          {instance.status === "complete" && (
            <span className="font-geist-mono text-[10px] uppercase tracking-wider text-foreground">
              Synthesis Complete
            </span>
          )}
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {instance.fileUrl ? (
          <object
            data={instance.fileUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="font-geist-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
                  PDF Preview Unavailable
                </div>
                <a
                  href={instance.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-geist-mono text-[11px] uppercase tracking-wider text-ai-active hover:underline"
                >
                  Open in New Tab →
                </a>
              </div>
            </div>
          </object>
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
              initial={{ top: "0%" }}
              animate={{ top: `${((instance.currentPage - 1) / instance.totalPages) * 100}%` }}
              transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
              className="absolute left-0 right-0 h-[1px] bg-ai-active pointer-events-none"
              style={{
                boxShadow: "0 0 15px hsl(215 100% 50%), 0 0 40px hsl(215 100% 50% / 0.3)",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Page Progress */}
      <div className="p-4 border-t border-border flex gap-1">
        {instance.summaries.map((s) => (
          <div
            key={s.pageNumber}
            className={`flex-1 h-1 transition-colors duration-300 ${
              s.status === "complete"
                ? "bg-foreground"
                : s.status === "scanning"
                ? "bg-ai-active animate-pulse"
                : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
