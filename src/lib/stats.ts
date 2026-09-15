import type { Subject, ChapterData } from '../data/syllabus';
import { getActiveSyllabus, SUBJECTS } from '../data/syllabus';
import type { ChapterProgress, CompletionHistoryEntry, DailyTarget } from './storage';
import { getCustomChapters } from './storage';
import type { AppConfig } from './config';

export type PaceStatus = 'GET_STARTED' | 'AHEAD' | 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED';

export type ChapterLifecycleStatus = 'not_started' | 'in_progress' | 'completed' | 'weak' | 'needs_revision';

export interface SubjectStats {
  subject: Subject;
  label: string;
  emoji: string;
  color: string;
  totalMarks: number;
  totalChapters: number;
  completedChapters: number;
  remainingChapters: number;
  chapterCompletionPct: number; // completed / total * 100
  totalTasks: number;           // totalChapters * 4
  completedTasks: number;
  taskCompletionPct: number;    // completedTasks / totalTasks * 100
  weakChaptersCount: number;
}

export interface NextBestAction {
  chapter: ChapterData;
  nextTaskLabel: string;
  nextTaskKey: 'syllabus' | 'questions' | 'test' | 'revision';
  priorityBadge: string;
}

export interface DashboardStats {
  // Overall PCM Syllabus
  totalChapters: number;
  completedChapters: number;
  remainingChapters: number;
  overallCompletionPct: number;

  // Task Telemetry
  totalTasks: number;
  completedTasks: number;
  taskCompletionPct: number;

  // Pace & Velocity
  requiredPaceChaptersPerDay: number;
  daysPerChapterRequired: number;
  actualPaceChaptersPerDay: number;
  paceStatus: PaceStatus;
  paceStatusLabel: string;
  chaptersAheadOrBehind: number;
  projectedCompletionDate: Date | null;

  // Deadlines & Timeline
  now: Date;
  syllabusDeadlineDate: Date;
  boardExamDate: Date;
  daysToSyllabusDeadline: number;
  daysToBoardExam: number;
  revisionWindowDays: number;

  // Subject Stats (Independent)
  subjects: Record<Subject, SubjectStats>;

  // Chapter Classification
  chapterStatusMap: Record<string, ChapterLifecycleStatus>;
  weakChapters: ChapterData[];
  needsRevisionChapters: ChapterData[];
  remainingChapterList: ChapterData[];

  // Action Recommendation
  nextBestAction: NextBestAction | null;
}

export function getDaysDiff(target: Date, base: Date = new Date()): number {
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  const b = new Date(base);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((t.getTime() - b.getTime()) / 86400000));
}

export function calculateChapterStatus(
  chapterId: string,
  progressMap: Record<string, ChapterProgress>
): ChapterLifecycleStatus {
  const p = progressMap[chapterId];
  if (!p) return 'not_started';

  const isCompleted = Boolean(p.is_completed);
  const isWeak = Boolean(p.is_weak);
  const isRevisionPending = isCompleted && !p.revision_done;
  const anyTaskDone = p.syllabus_done || p.questions_done || p.test_done || p.revision_done || Boolean(p.notes?.trim());

  if (isCompleted) {
    if (isWeak) return 'weak';
    if (isRevisionPending) return 'needs_revision';
    return 'completed';
  }

  if (isWeak) return 'weak';
  if (anyTaskDone) return 'in_progress';
  return 'not_started';
}

export function calculateDashboardStats(
  progress: Record<string, ChapterProgress>,
  config: AppConfig,
  _todayTarget?: DailyTarget,
  history?: CompletionHistoryEntry[],
  now: Date = new Date(),
  customSyllabus?: ChapterData[]
): DashboardStats {
  const activeSyllabus: ChapterData[] = customSyllabus
    || getActiveSyllabus(config?.gradePreset || 'cbse-12-pcm', getCustomChapters(config?.gradePreset || 'cbse-12-pcm'));
  const totalChapters = activeSyllabus.length;
  const totalTasks = totalChapters * 4;

  // 1. Chapter and Task Completion (Single Source of Truth)
  let completedChaptersCount = 0;
  let completedTasksCount = 0;
  const chapterStatusMap: Record<string, ChapterLifecycleStatus> = {};
  const weakChapters: ChapterData[] = [];
  const needsRevisionChapters: ChapterData[] = [];
  const remainingChapterList: ChapterData[] = [];

  for (const chapter of activeSyllabus) {
    const p = progress[chapter.id];
    const status = calculateChapterStatus(chapter.id, progress);
    chapterStatusMap[chapter.id] = status;

    if (p?.is_completed) {
      completedChaptersCount++;
    } else {
      remainingChapterList.push(chapter);
    }

    if (p?.is_weak) {
      weakChapters.push(chapter);
    }

    if (p?.is_completed && !p?.revision_done) {
      needsRevisionChapters.push(chapter);
    }

    if (p) {
      if (p.syllabus_done) completedTasksCount++;
      if (p.questions_done) completedTasksCount++;
      if (p.test_done) completedTasksCount++;
      if (p.revision_done) completedTasksCount++;
    }
  }

  const remainingChaptersCount = Math.max(0, totalChapters - completedChaptersCount);
  const overallCompletionPct = totalChapters > 0
    ? Math.round((completedChaptersCount / totalChapters) * 1000) / 10
    : 0;
  const taskCompletionPct = totalTasks > 0
    ? Math.round((completedTasksCount / totalTasks) * 1000) / 10
    : 0;

  // 2. Deadlines & Window Calculations
  const syllabusDeadlineDate = new Date(`${config.syllabusDeadline}T00:00:00`);
  const boardExamDate = new Date(`${config.boardExamDate}T00:00:00`);

  const daysToSyllabusDeadline = getDaysDiff(syllabusDeadlineDate, now);
  const daysToBoardExam = getDaysDiff(boardExamDate, now);
  const revisionWindowDays = Math.max(0, Math.ceil((boardExamDate.getTime() - syllabusDeadlineDate.getTime()) / 86400000));

  // 3. Required Run-Rate Pace (remaining chapters / remaining days)
  const effectiveDeadlineDays = Math.max(1, daysToSyllabusDeadline);
  const requiredPaceChaptersPerDay = remainingChaptersCount === 0
    ? 0
    : Math.round((remainingChaptersCount / effectiveDeadlineDays) * 100) / 100;

  const daysPerChapterRequired = requiredPaceChaptersPerDay > 0
    ? Math.round((1 / requiredPaceChaptersPerDay) * 10) / 10
    : 0;

  // 4. Actual Pace & Completion Velocity
  // Rolling 7-day window or days since start
  const baseStartDate = new Date(`${config.startDate}T00:00:00`);
  const elapsedDaysSinceStart = Math.max(1, getDaysDiff(now, baseStartDate));
  const rollingDays = Math.min(14, elapsedDaysSinceStart);

  let recentCompletions = 0;
  if (history && history.length > 0) {
    const cutoff = new Date(now.getTime() - rollingDays * 86400000);
    recentCompletions = history.filter(h => new Date(h.timestamp) >= cutoff).length;
  } else {
    // Fallback if no detailed history yet: completed chapters spread over elapsed days
    recentCompletions = completedChaptersCount;
  }

  const actualPaceChaptersPerDay = Math.round((recentCompletions / rollingDays) * 100) / 100;

  // 5. Pace Status Determination
  let paceStatus: PaceStatus = 'ON_TRACK';
  let paceStatusLabel = 'ON TRACK';
  let chaptersAheadOrBehind = 0;

  if (remainingChaptersCount === 0) {
    paceStatus = 'COMPLETED';
    paceStatusLabel = 'SYLLABUS COMPLETED';
  } else if (completedChaptersCount === 0) {
    paceStatus = 'GET_STARTED';
    paceStatusLabel = 'GET STARTED';
  } else {
    const expectedCompletedByNow = Math.round(requiredPaceChaptersPerDay * elapsedDaysSinceStart);
    chaptersAheadOrBehind = completedChaptersCount - expectedCompletedByNow;

    if (actualPaceChaptersPerDay >= requiredPaceChaptersPerDay * 1.15) {
      paceStatus = 'AHEAD';
      paceStatusLabel = 'AHEAD OF PACE';
    } else if (actualPaceChaptersPerDay >= requiredPaceChaptersPerDay * 0.85) {
      paceStatus = 'ON_TRACK';
      paceStatusLabel = 'ON TRACK';
    } else if (actualPaceChaptersPerDay >= requiredPaceChaptersPerDay * 0.5) {
      paceStatus = 'AT_RISK';
      paceStatusLabel = 'AT RISK';
    } else {
      paceStatus = 'BEHIND';
      paceStatusLabel = 'BEHIND SCHEDULE';
    }
  }

  // 6. Projected Completion Date
  let projectedCompletionDate: Date | null = null;
  if (remainingChaptersCount === 0) {
    projectedCompletionDate = now;
  } else {
    const effectivePace = actualPaceChaptersPerDay > 0 ? actualPaceChaptersPerDay : requiredPaceChaptersPerDay;
    if (effectivePace > 0) {
      const daysNeeded = Math.ceil(remainingChaptersCount / effectivePace);
      projectedCompletionDate = new Date(now.getTime() + daysNeeded * 86400000);
    }
  }

  // 7. Independent Subject Statistics
  const subjectsMap = {} as Record<Subject, SubjectStats>;
  const subjectKeys: Subject[] = ['physics', 'chemistry', 'maths'];

  for (const sub of subjectKeys) {
    const subChapters = activeSyllabus.filter(c => c.subject === sub);
    const subTotal = subChapters.length;
    let subCompleted = 0;
    let subTasksDone = 0;
    let subWeakCount = 0;

    for (const ch of subChapters) {
      const p = progress[ch.id];
      if (p?.is_completed) subCompleted++;
      if (p?.is_weak) subWeakCount++;
      if (p) {
        if (p.syllabus_done) subTasksDone++;
        if (p.questions_done) subTasksDone++;
        if (p.test_done) subTasksDone++;
        if (p.revision_done) subTasksDone++;
      }
    }

    const subTotalTasks = subTotal * 4;
    const computedTotalMarks = subChapters.reduce((acc, c) => acc + (c.marks || 0), 0);
    subjectsMap[sub] = {
      subject: sub,
      label: SUBJECTS[sub].label,
      emoji: SUBJECTS[sub].emoji,
      color: SUBJECTS[sub].color,
      totalMarks: computedTotalMarks > 0 ? computedTotalMarks : SUBJECTS[sub].total,
      totalChapters: subTotal,
      completedChapters: subCompleted,
      remainingChapters: subTotal - subCompleted,
      chapterCompletionPct: subTotal > 0 ? Math.round((subCompleted / subTotal) * 1000) / 10 : 0,
      totalTasks: subTotalTasks,
      completedTasks: subTasksDone,
      taskCompletionPct: subTotalTasks > 0 ? Math.round((subTasksDone / subTotalTasks) * 1000) / 10 : 0,
      weakChaptersCount: subWeakCount,
    };
  }

  // 8. Next Best Action Recommender
  let nextBestAction: NextBestAction | null = null;
  // Priority sorting: must-do > high > medium > easy
  const priorityWeight: Record<string, number> = {
    'must-do': 4,
    high: 3,
    medium: 2,
    easy: 1,
  };

  const prioritizedRemaining = [...remainingChapterList].sort((a, b) => {
    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
  });

  if (prioritizedRemaining.length > 0) {
    const topChapter = prioritizedRemaining[0];
    const p = progress[topChapter.id];

    let nextTaskLabel = 'Read Syllabus & Core Derivations';
    let nextTaskKey: NextBestAction['nextTaskKey'] = 'syllabus';

    if (p) {
      if (!p.syllabus_done) {
        nextTaskLabel = 'Read Syllabus & Core Derivations';
        nextTaskKey = 'syllabus';
      } else if (!p.questions_done) {
        nextTaskLabel = 'Solve NCERT Exercises & 5-Year PYQs';
        nextTaskKey = 'questions';
      } else if (!p.test_done) {
        nextTaskLabel = 'Attempt Chapter Test & Score Assessment';
        nextTaskKey = 'test';
      } else if (!p.revision_done) {
        nextTaskLabel = 'Revise Weak Points & Formula Sheet';
        nextTaskKey = 'revision';
      } else {
        nextTaskLabel = 'Mark Chapter Completed';
        nextTaskKey = 'revision';
      }
    }

    nextBestAction = {
      chapter: topChapter,
      nextTaskLabel,
      nextTaskKey,
      priorityBadge: topChapter.priorityLabel,
    };
  }

  return {
    totalChapters,
    completedChapters: completedChaptersCount,
    remainingChapters: remainingChaptersCount,
    overallCompletionPct,
    totalTasks,
    completedTasks: completedTasksCount,
    taskCompletionPct,
    requiredPaceChaptersPerDay,
    daysPerChapterRequired,
    actualPaceChaptersPerDay,
    paceStatus,
    paceStatusLabel,
    chaptersAheadOrBehind,
    projectedCompletionDate,
    now,
    syllabusDeadlineDate,
    boardExamDate,
    daysToSyllabusDeadline,
    daysToBoardExam,
    revisionWindowDays,
    subjects: subjectsMap,
    chapterStatusMap,
    weakChapters,
    needsRevisionChapters,
    remainingChapterList,
    nextBestAction,
  };
}
