import { motion } from "framer-motion";
import { FileText, Plus } from "lucide-react";
import type { AxiomInstance } from "@/hooks/useAxiomEngine";

interface DocumentLibraryProps {
  instances: AxiomInstance[];
  activeInstanceId: string | null;
  onSelectInstance: (id: string) => void;
  onUpload: (file: File) => void;
}

export function DocumentLibrary({
  instances,
  activeInstanceId,
  onSelectInstance,
  onUpload,
}: DocumentLibraryProps) {
  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onUpload(file);
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col border-r border-border bg-secondary">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Axiom_01
        </div>
        <div className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
          Document Library
        </div>
      </div>

      {/* Instance List */}
      <div className="flex-1 overflow-y-auto">
        {instances.map((inst) => (
          <motion.button
            key={inst.id}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelectInstance(inst.id)}
            className={`w-full text-left p-4 border-b border-border flex items-start gap-3 transition-colors duration-150 ${
              inst.id === activeInstanceId
                ? "bg-primary text-primary-foreground"
                : "bg-transparent hover:bg-muted"
            }`}
          >
            <FileText size={14} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate tracking-tight">
                {inst.name}
              </div>
              <div
                className={`font-geist-mono text-[10px] mt-1 uppercase tracking-wider ${
                  inst.id === activeInstanceId
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground"
                }`}
              >
                {inst.status === "scanning"
                  ? `Scanning P${inst.currentPage}/${inst.totalPages}`
                  : inst.status === "complete"
                  ? `Complete — ${inst.hypotheses.length} hypotheses`
                  : "Idle"}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* New Upload */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleFileSelect}
          className="w-full border border-border bg-background text-foreground py-3 px-4 flex justify-between items-center hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
        >
          <span className="text-[12px] font-bold uppercase tracking-wider font-geist-mono">
            Upload PDF
          </span>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
