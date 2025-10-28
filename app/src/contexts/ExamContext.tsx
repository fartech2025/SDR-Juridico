import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Exam = {
  id_prova: number;
  nome: string;
  descricao?: string | null;
  tempo_por_questao?: number | null;
};

type ExamContextValue = {
  selectedExam: Exam | null;
  selectExam: (exam: Exam) => void;
  clearExam: () => void;
};

const ExamContext = createContext<ExamContextValue | undefined>(undefined);
const STORAGE_KEY = "enem-selected-exam";

export function ExamProvider({ children }: { children: ReactNode }) {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Exam;
        if (parsed && typeof parsed.id_prova === "number") {
          setSelectedExam(parsed);
        }
      } catch (error) {
        console.warn("failed to restore exam selection", error);
      }
    }
  }, []);

  const value = useMemo<ExamContextValue>(() => ({
    selectedExam,
    selectExam: (exam) => {
      setSelectedExam(exam);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exam));
    },
    clearExam: () => {
      setSelectedExam(null);
      localStorage.removeItem(STORAGE_KEY);
    },
  }), [selectedExam]);

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) {
    throw new Error("useExam must be used within ExamProvider");
  }
  return ctx;
}
