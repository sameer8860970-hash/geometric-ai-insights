import { useState, useCallback } from "react";

export interface PageSummary {
  pageNumber: number;
  summary: string;
  status: "pending" | "scanning" | "complete";
  timestamp?: string;
}

export interface Hypothesis {
  id: string;
  fromPage: number;
  toPage: number;
  text: string;
  confidence: number;
}

export interface AxiomInstance {
  id: string;
  name: string;
  fileName: string;
  totalPages: number;
  currentPage: number;
  summaries: PageSummary[];
  hypotheses: Hypothesis[];
  status: "idle" | "scanning" | "complete";
  fileUrl: string | null;
}

const MOCK_SUMMARIES: Record<number, string> = {
  1: "The document establishes a foundational framework for distributed consensus mechanisms, introducing novel terminology for fault-tolerant protocols in adversarial environments.",
  2: "Mathematical proofs demonstrate that Byzantine fault tolerance requires a minimum of 3f+1 nodes to withstand f faulty processors. Time complexity bounds are established at O(n²).",
  3: "A comparative analysis of Paxos and Raft protocols reveals convergence properties under partial synchrony. The authors identify a previously unexplored edge case in leader election.",
  4: "Experimental results from a 1000-node testbed confirm theoretical bounds. Throughput degrades linearly beyond 33% fault injection, validating the theoretical model from Page 2.",
  5: "The conclusion proposes a hybrid protocol combining elements of both Paxos and Raft, suggesting 40% improvement in recovery time. Cross-references findings from Pages 1-4.",
};

const generateHypothesis = (fromPage: number, toPage: number): Hypothesis => {
  const hypotheses: Record<string, string> = {
    "1-2": "The fault tolerance framework (P1) combined with the Byzantine bounds (P2) suggests a novel lower bound for asynchronous consensus that hasn't been formally proven.",
    "2-3": "The O(n²) complexity from P2 may be reducible to O(n log n) using the Raft optimizations identified in P3's edge case analysis.",
    "3-4": "The unexplored leader election edge case (P3) likely caused the non-linear degradation pattern observed at exactly 28% fault injection (P4).",
    "1-4": "Cross-referencing P1's framework with P4's empirical data reveals the theoretical model underestimates real-world performance by approximately 12%.",
    "2-5": "The proposed hybrid protocol (P5) should inherit the O(n²) bound from P2, not improve it — suggesting an error in the authors' complexity analysis.",
    "4-5": "The 40% improvement claim (P5) is consistent with P4's testbed data only under partial synchrony — the claim may not hold under full asynchrony.",
  };

  const key = `${fromPage}-${toPage}`;
  return {
    id: `hyp-${fromPage}-${toPage}-${Date.now()}`,
    fromPage,
    toPage,
    text: hypotheses[key] || `Correlation detected between structural elements on Page ${fromPage} and conclusions drawn on Page ${toPage}. Further analysis recommended.`,
    confidence: Math.round(85 + Math.random() * 12 * 10) / 10,
  };
};

export function useAxiomEngine() {
  const [instances, setInstances] = useState<AxiomInstance[]>([]);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  const activeInstance = instances.find((i) => i.id === activeInstanceId) || null;

  const createInstance = useCallback((file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const totalPages = Math.max(3, Math.floor(Math.random() * 5) + 3);
    const newInstance: AxiomInstance = {
      id: `inst-${Date.now()}`,
      name: file.name.replace(".pdf", ""),
      fileName: file.name,
      totalPages,
      currentPage: 0,
      summaries: Array.from({ length: totalPages }, (_, i) => ({
        pageNumber: i + 1,
        summary: "",
        status: "pending" as const,
      })),
      hypotheses: [],
      status: "idle",
      fileUrl,
    };

    setInstances((prev) => [...prev, newInstance]);
    setActiveInstanceId(newInstance.id);

    // Start autonomous scanning
    setTimeout(() => startScanning(newInstance.id, totalPages), 500);
  }, []);

  const startScanning = (instanceId: string, totalPages: number) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === instanceId ? { ...inst, status: "scanning" } : inst
      )
    );

    let page = 1;

    const scanPage = () => {
      if (page > totalPages) {
        setInstances((prev) =>
          prev.map((inst) =>
            inst.id === instanceId ? { ...inst, status: "complete" } : inst
          )
        );
        return;
      }

      const currentPage = page;

      // Mark as scanning
      setInstances((prev) =>
        prev.map((inst) =>
          inst.id === instanceId
            ? {
                ...inst,
                currentPage: currentPage,
                summaries: inst.summaries.map((s) =>
                  s.pageNumber === currentPage ? { ...s, status: "scanning" } : s
                ),
              }
            : inst
        )
      );

      // Complete after delay
      setTimeout(() => {
        const summary = MOCK_SUMMARIES[currentPage] ||
          `Page ${currentPage} contains structured data tables and cross-references to earlier sections. Key findings support the document's central thesis with ${Math.round(88 + Math.random() * 10)}% statistical significance.`;

        setInstances((prev) =>
          prev.map((inst) => {
            if (inst.id !== instanceId) return inst;

            const updatedSummaries = inst.summaries.map((s) =>
              s.pageNumber === currentPage
                ? {
                    ...s,
                    status: "complete" as const,
                    summary,
                    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
                  }
                : s
            );

            // Generate hypothesis every 2 pages
            const newHypotheses = [...inst.hypotheses];
            if (currentPage >= 2 && currentPage % 2 === 0) {
              newHypotheses.push(
                generateHypothesis(currentPage - 1, currentPage)
              );
            }
            if (currentPage >= 3) {
              newHypotheses.push(generateHypothesis(1, currentPage));
            }

            return {
              ...inst,
              summaries: updatedSummaries,
              hypotheses: newHypotheses,
            };
          })
        );

        page++;
        setTimeout(scanPage, 2000 + Math.random() * 1500);
      }, 1500 + Math.random() * 1000);
    };

    scanPage();
  };

  const spawnFromHypothesis = useCallback((hypothesis: Hypothesis) => {
    const newInstance: AxiomInstance = {
      id: `inst-${Date.now()}`,
      name: `Thread: P${hypothesis.fromPage}→P${hypothesis.toPage}`,
      fileName: "Derived Instance",
      totalPages: 3,
      currentPage: 0,
      summaries: [
        {
          pageNumber: 1,
          summary: `SOURCE HYPOTHESIS: "${hypothesis.text}"`,
          status: "complete",
          timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        },
        { pageNumber: 2, summary: "", status: "pending" },
        { pageNumber: 3, summary: "", status: "pending" },
      ],
      hypotheses: [],
      status: "idle",
      fileUrl: null,
    };

    setInstances((prev) => [...prev, newInstance]);
    setActiveInstanceId(newInstance.id);
    setTimeout(() => startScanning(newInstance.id, 3), 800);
  }, []);

  return {
    instances,
    activeInstance,
    activeInstanceId,
    setActiveInstanceId,
    createInstance,
    spawnFromHypothesis,
  };
}
