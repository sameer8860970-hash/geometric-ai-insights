import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import type { AxiomInstance, Hypothesis } from "@/hooks/useAxiomEngine";

interface IntelligenceFeedProps {
  instance: AxiomInstance | null;
  onSpawnInstance: (hypothesis: Hypothesis) => void;
}

export function IntelligenceFeed({ instance, onSpawnInstance }: IntelligenceFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new items appear
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [instance?.summaries, instance?.hypotheses]);

  if (!instance) {
    return (
      <div className="h-full flex flex-col bg-secondary">
        <div className="p-6 border-b border-border shrink-0">
          <div className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Intelligence Feed
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="font-geist-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 text-center px-8">
            Upload a document to begin<br />autonomous synthesis
          </div>
        </div>
      </div>
    );
  }

  const completedSummaries = instance.summaries.filter((s) => s.status === "complete" || s.status === "error");
  const scanningPage = instance.summaries.find((s) => s.status === "scanning");

  // Interleave summaries and hypotheses
  const feedItems: Array<
    | { type: "summary"; data: typeof instance.summaries[0] }
    | { type: "hypothesis"; data: Hypothesis }
    | { type: "scanning"; pageNumber: number }
  > = [];

  completedSummaries.forEach((s) => {
    feedItems.push({ type: "summary", data: s });
    instance.hypotheses
      .filter((h) => h.toPage === s.pageNumber)
      .forEach((h) => feedItems.push({ type: "hypothesis", data: h }));
  });

  if (scanningPage) {
    feedItems.push({ type: "scanning", pageNumber: scanningPage.pageNumber });
  }

  return (
    <div className="h-full flex flex-col bg-secondary min-h-0">
      {/* Header */}
      <div className="p-6 border-b border-border shrink-0">
        <div className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Intelligence Feed
        </div>
        <div className="font-geist-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mt-1">
          {instance.status === "scanning"
            ? `Processing — ${completedSummaries.length}/${instance.totalPages} Pages · ${instance.hypotheses.length} Hypotheses`
            : instance.status === "complete"
            ? `Complete — ${instance.totalPages} Pages · ${instance.hypotheses.length} Hypotheses · Confidence ${
                instance.hypotheses.length > 0
                  ? (
                      instance.hypotheses.reduce((a, h) => a + h.confidence, 0) /
                      instance.hypotheses.length
                    ).toFixed(1)
                  : "—"
              }%`
            : instance.status === "error"
            ? "Error during analysis"
            : "Awaiting input"}
        </div>
      </div>

      {/* Feed — scrollable */}
      <div ref={feedRef} className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="popLayout">
          {feedItems.map((item) => {
            if (item.type === "summary") {
              const isError = item.data.status === "error";
              return (
                <motion.div
                  key={`summary-${item.data.pageNumber}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                  className={`border-l-2 ${isError ? "border-destructive" : "border-foreground"} bg-background p-5 border-b border-b-border`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Page {item.data.pageNumber} — {isError ? "Error" : "Summary"}
                    </span>
                    {item.data.timestamp && (
                      <span className="font-geist-mono text-[10px] text-muted-foreground/50">
                        {item.data.timestamp}
                      </span>
                    )}
                  </div>
                  <p className={`font-document text-[14px] leading-relaxed ${isError ? "text-destructive" : "text-foreground/80"}`}>
                    {item.data.summary}
                  </p>
                </motion.div>
              );
            }

            if (item.type === "hypothesis") {
              return (
                <motion.div
                  key={item.data.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                  className="mx-3 my-2"
                >
                  <div className="bg-primary text-primary-foreground p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={10} />
                      <span className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60">
                        Hypothesis Bridge — P{item.data.fromPage}→P{item.data.toPage}
                      </span>
                      <span className="font-geist-mono text-[10px] text-primary-foreground/40 ml-auto">
                        {item.data.confidence}%
                      </span>
                    </div>
                    <p className="font-document text-[13px] leading-relaxed text-primary-foreground/90 mb-3">
                      {item.data.text}
                    </p>
                    <button
                      onClick={() => onSpawnInstance(item.data)}
                      className="w-full border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground py-2 px-3 flex justify-between items-center hover:bg-primary-foreground hover:text-primary transition-colors duration-200"
                    >
                      <span className="font-geist-mono text-[10px] font-bold uppercase tracking-wider">
                        Spawn New Instance
                      </span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            }

            if (item.type === "scanning") {
              return (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 border-l-2 border-ai-active"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ai-active animate-pulse" />
                    <span className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-ai-active">
                      Scanning Page {item.pageNumber}...
                    </span>
                  </div>
                  <div className="mt-3 h-3 bg-border overflow-hidden">
                    <motion.div
                      className="h-full bg-ai-active"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              );
            }

            return null;
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
