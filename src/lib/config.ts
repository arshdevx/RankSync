export type SyllabusPreset = 'cbse-12-pcm' | 'cbse-11-pcm' | 'jee-pcm' | 'custom';

export interface AppConfig {
  userName: string;              // Student Name, e.g. "Arsh"
  gradePreset: SyllabusPreset;   // Active syllabus preset
  syllabusDeadline: string;      // Expected syllabus completion date (ISO 'YYYY-MM-DD')
  mockTestStartDate: string;     // Mock test series / sample paper start date (ISO 'YYYY-MM-DD')
  boardExamDate: string;         // Final board / competitive exam date (ISO 'YYYY-MM-DD')
  startDate: string;             // Academic tracker start date (ISO 'YYYY-MM-DD')
  isOnboarded: boolean;          // Whether initial setup wizard has been completed
  dailyQuestionsTarget: number;  // Questions target per day (default 20)
  dailyStudyMinutes: number;     // Study focus minutes per day (default 240 = 4h)
}

const CONFIG_KEY = 'pcm_tracker_config_v1';

export const DEFAULT_CONFIG: AppConfig = {
  userName: '',
  gradePreset: 'cbse-12-pcm',
  syllabusDeadline: '2026-11-15',
  mockTestStartDate: '2026-11-16',
  boardExamDate: '2027-02-05',
  startDate: '2026-09-13',
  isOnboarded: false,
  dailyQuestionsTarget: 20,
  dailyStudyMinutes: 240,
};

export function getAppConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      userName: parsed.userName ?? DEFAULT_CONFIG.userName,
      gradePreset: parsed.gradePreset || DEFAULT_CONFIG.gradePreset,
      syllabusDeadline: parsed.syllabusDeadline || DEFAULT_CONFIG.syllabusDeadline,
      mockTestStartDate: parsed.mockTestStartDate || DEFAULT_CONFIG.mockTestStartDate,
      boardExamDate: parsed.boardExamDate || DEFAULT_CONFIG.boardExamDate,
      startDate: parsed.startDate || DEFAULT_CONFIG.startDate,
      isOnboarded: typeof parsed.isOnboarded === 'boolean' ? parsed.isOnboarded : DEFAULT_CONFIG.isOnboarded,
      dailyQuestionsTarget: parsed.dailyQuestionsTarget || DEFAULT_CONFIG.dailyQuestionsTarget,
      dailyStudyMinutes: parsed.dailyStudyMinutes || DEFAULT_CONFIG.dailyStudyMinutes,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveAppConfig(patch: Partial<AppConfig>): AppConfig {
  const current = getAppConfig();
  const next = { ...current, ...patch };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pcm_config_updated', { detail: next }));
  }
  return next;
}
