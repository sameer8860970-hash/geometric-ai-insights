import { DocumentLibrary } from "@/components/axiom/DocumentLibrary";
import { PDFViewer } from "@/components/axiom/PDFViewer";
import { IntelligenceFeed } from "@/components/axiom/IntelligenceFeed";
import { useAxiomEngine } from "@/hooks/useAxiomEngine";

const Index = () => {
  const {
    instances,
    activeInstance,
    activeInstanceId,
    setActiveInstanceId,
    createInstance,
    spawnFromHypothesis,
  } = useAxiomEngine();

  const handleUpload = (file: File) => {
    createInstance(file);
  };

  return (
    <div className="h-screen w-screen grid grid-cols-[280px_1fr_400px] overflow-hidden bg-background">
      {/* Left Rail: Document Library */}
      <DocumentLibrary
        instances={instances}
        activeInstanceId={activeInstanceId}
        onSelectInstance={setActiveInstanceId}
        onUpload={handleUpload}
      />

      {/* Center: PDF Viewer */}
      <PDFViewer instance={activeInstance} onUpload={handleUpload} />

      {/* Right Rail: Intelligence Feed */}
      <IntelligenceFeed
        instance={activeInstance}
        onSpawnInstance={spawnFromHypothesis}
      />
    </div>
  );
};

export default Index;
