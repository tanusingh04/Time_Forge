import { useState, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { useAppState } from "@/context/AppContext";
import Layout from "@/components/Layout";
import { FileText, Upload, Trash2, Plus, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

const SyllabusPage = () => {
  const {
    syllabusFiles,
    addSyllabusFile,
    removeSyllabusFile,
    addModuleToSubject,
    removeModuleFromSubject,
  } = useAppState();
  const [fileName, setFileName] = useState("");
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [useCustomSubject, setUseCustomSubject] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());
  const [moduleInputs, setModuleInputs] = useState<Record<number, { name: string; hours: string }>>({});

  const syllabusSubjects = Array.from(
    new Set(syllabusFiles.filter((f) => f.subject).map((f) => f.subject!))
  ).sort();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    if (selectedFile && !fileName) {
      setFileName(selectedFile.name);
    }
  };

  const handleUpload = () => {
    const finalSubject = useCustomSubject ? customSubject.trim() : subject.trim();
    if (!file || !fileName.trim() || !finalSubject) return;

    const url = URL.createObjectURL(file);
    addSyllabusFile({
      name: fileName.trim(),
      subject: finalSubject,
      url,
    }, file);

    setFileName("");
    setSubject("");
    setCustomSubject("");
    setUseCustomSubject(false);
    setFile(null);
  };

  const toggleSubject = (index: number) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSubjects(newExpanded);
  };

  const handleAddModule = (subjectIndex: number) => {
    const input = moduleInputs[subjectIndex];
    if (!input || !input.name.trim()) return;

    addModuleToSubject(subjectIndex, {
      name: input.name.trim(),
      estimatedHours: input.hours ? parseFloat(input.hours) : undefined,
    });

    setModuleInputs({ ...moduleInputs, [subjectIndex]: { name: "", hours: "" } });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Syllabus Files</h1>
          <p className="text-sm text-muted-foreground">Keep track of your course syllabus documents</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border border-dashed"
        >
          <div className="space-y-4">
            <Upload size={32} className="mx-auto text-primary opacity-60" />
            <p className="text-sm text-muted-foreground">
              Attach a PDF syllabus for each subject so you can quickly open it while planning.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                {syllabusSubjects.length > 0 && !useCustomSubject ? (
                  <Select
                    value={subject}
                    onValueChange={(value) => {
                      if (value === "__custom__") {
                        setUseCustomSubject(true);
                        setSubject("");
                      } else {
                        setSubject(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject or add new" />
                    </SelectTrigger>
                    <SelectContent>
                      {syllabusSubjects.map((subj) => (
                        <SelectItem key={subj} value={subj}>
                          {subj}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-primary font-medium">
                        + Add New Subject
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Subject (e.g., Mathematics)"
                      value={syllabusSubjects.length > 0 ? customSubject : subject}
                      onChange={(e) =>
                        syllabusSubjects.length > 0
                          ? setCustomSubject(e.target.value)
                          : setSubject(e.target.value)
                      }
                    />
                    {syllabusSubjects.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUseCustomSubject(false);
                          setCustomSubject("");
                          setSubject("");
                        }}
                        className="text-xs h-6 w-full"
                      >
                        ← Select from existing subjects
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Display name (e.g., Midterm Syllabus.pdf)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpload()}
              />
              <Button
                onClick={handleUpload}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={
                  !file ||
                  !fileName.trim() ||
                  !(
                    syllabusSubjects.length > 0
                      ? useCustomSubject
                        ? customSubject.trim()
                        : subject.trim()
                      : subject.trim()
                  )
                }
              >
                Add
              </Button>
            </div>
          </div>
        </motion.div>

        {syllabusFiles.length > 0 && (
          <div className="space-y-3">
            {syllabusFiles.map((file, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4">
                  <FileText size={20} className="text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.subject && <span className="mr-1 font-medium">{file.subject} ·</span>}
                      Added {new Date(file.uploadedAt).toLocaleDateString()}
                      {file.modules && file.modules.length > 0 && (
                        <span className="ml-1">· {file.modules.length} module{file.modules.length !== 1 ? "s" : ""}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.url && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          View PDF
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSubject(i)}
                      aria-label="Toggle modules"
                    >
                      {expandedSubjects.has(i) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSyllabusFile(i)}
                      aria-label="Remove syllabus file"
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </div>

                <Collapsible open={expandedSubjects.has(i)}>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={16} className="text-primary" />
                        <h3 className="text-sm font-semibold">Modules/Topics</h3>
                      </div>

                      {file.modules && file.modules.length > 0 && (
                        <div className="space-y-2">
                          {file.modules.map((module) => (
                            <div
                              key={module.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-secondary border border-border"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{module.name}</p>
                                {module.estimatedHours && (
                                  <p className="text-xs text-muted-foreground">
                                    ~{module.estimatedHours} hour{module.estimatedHours !== 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeModuleFromSubject(i, module.id)}
                                className="h-7 w-7"
                              >
                                <Trash2 size={14} className="text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Input
                          placeholder="Module/Topic name (e.g., Module 1: Introduction)"
                          value={moduleInputs[i]?.name || ""}
                          onChange={(e) =>
                            setModuleInputs({
                              ...moduleInputs,
                              [i]: { ...moduleInputs[i], name: e.target.value },
                            })
                          }
                          onKeyDown={(e) => e.key === "Enter" && handleAddModule(i)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Hours"
                          value={moduleInputs[i]?.hours || ""}
                          onChange={(e) =>
                            setModuleInputs({
                              ...moduleInputs,
                              [i]: { ...moduleInputs[i], hours: e.target.value },
                            })
                          }
                          className="w-20"
                          min="0"
                          step="0.5"
                        />
                        <Button
                          onClick={() => handleAddModule(i)}
                          size="sm"
                          className="bg-primary text-primary-foreground"
                        >
                          <Plus size={14} className="mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SyllabusPage;
