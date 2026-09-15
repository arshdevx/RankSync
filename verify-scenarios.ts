import { calculateDashboardStats, calculateChapterStatus } from './src/lib/stats';
import type { AppConfig } from './src/lib/config';
import type { ChapterProgress } from './src/lib/storage';
import { SYLLABUS } from './src/data/syllabus';

const baseConfig: AppConfig = {
  syllabusDeadline: '2026-11-15',
  boardExamDate: '2027-02-05',
  startDate: '2026-09-13',
  waterIntervalMinutes: 45,
};

const fixedNow = new Date('2026-09-14T09:00:00');

console.log('========================================================');
console.log('RUNNING CBSE CLASS 12 PCM TRACKER SCENARIO TEST SUITE');
console.log('========================================================\n');

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  PASS: ${testName}`);
  } else {
    console.error(`  FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
  }
}

// ----------------------------------------------------
// SCENARIO A: Initial state (0/37 chapters completed)
// ----------------------------------------------------
console.log('--- SCENARIO A: 0/37 Chapters Completed (Initial State) ---');
const progressA: Record<string, ChapterProgress> = {};
const statsA = calculateDashboardStats(progressA, baseConfig, undefined, undefined, fixedNow);

assert(statsA.totalChapters === 37, 'Total chapters is 37');
assert(statsA.completedChapters === 0, 'Completed chapters is 0');
assert(statsA.remainingChapters === 37, 'Remaining chapters is 37');
assert(statsA.overallCompletionPct === 0, 'Overall completion % is 0%');
assert(statsA.daysToSyllabusDeadline === 62, `Days to deadline is 62 (got ${statsA.daysToSyllabusDeadline})`);
assert(statsA.requiredPaceChaptersPerDay === 0.6, `Required pace is 0.60 ch/day (got ${statsA.requiredPaceChaptersPerDay})`);
assert(statsA.daysPerChapterRequired === 1.7, `Days per chapter is ~1.7 (got ${statsA.daysPerChapterRequired})`);
assert(statsA.paceStatus === 'GET_STARTED', `Pace status is GET_STARTED (got ${statsA.paceStatus})`);
assert(statsA.revisionWindowDays === 82, `Revision window is 82 days (got ${statsA.revisionWindowDays})`);
assert(statsA.subjects.physics.chapterCompletionPct === 0, 'Physics completion is 0%');
assert(statsA.subjects.chemistry.chapterCompletionPct === 0, 'Chemistry completion is 0%');
assert(statsA.subjects.maths.chapterCompletionPct === 0, 'Maths completion is 0%');

// ----------------------------------------------------
// SCENARIO B: 5 Chapters Completed (3 Physics, 2 Chemistry)
// ----------------------------------------------------
console.log('\n--- SCENARIO B: 5 Chapters Completed (Dynamic Run-Rate Drop) ---');
const progressB: Record<string, ChapterProgress> = {};
// Complete 3 physics chapters
progressB['phy-1'] = { id: 'phy-1', is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: true, is_weak: false, notes: '' };
progressB['phy-2'] = { id: 'phy-2', is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: true, is_weak: false, notes: '' };
progressB['phy-3'] = { id: 'phy-3', is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: true, is_weak: false, notes: '' };
// Complete 2 chemistry chapters
progressB['chem-1'] = { id: 'chem-1', is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: true, is_weak: false, notes: '' };
progressB['chem-2'] = { id: 'chem-2', is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: true, is_weak: false, notes: '' };

const statsB = calculateDashboardStats(progressB, baseConfig, undefined, undefined, fixedNow);

assert(statsB.completedChapters === 5, 'Completed chapters is 5');
assert(statsB.remainingChapters === 32, 'Remaining chapters is 32');
assert(statsB.overallCompletionPct === 13.5, `Overall completion % is 13.5% (got ${statsB.overallCompletionPct}%)`);
assert(statsB.requiredPaceChaptersPerDay === 0.52, `Required pace dropped dynamically from 0.60 to 0.52 ch/day (got ${statsB.requiredPaceChaptersPerDay})`);
assert(statsB.daysPerChapterRequired === 1.9, `Days per chapter is ~1.9 (got ${statsB.daysPerChapterRequired})`);
assert(statsB.subjects.physics.completedChapters === 3, `Physics completed 3/14 (got ${statsB.subjects.physics.completedChapters})`);
assert(statsB.subjects.physics.chapterCompletionPct === 21.4, `Physics completion % is 21.4% (got ${statsB.subjects.physics.chapterCompletionPct}%)`);
assert(statsB.subjects.chemistry.completedChapters === 2, `Chemistry completed 2/10 (got ${statsB.subjects.chemistry.completedChapters})`);
assert(statsB.subjects.chemistry.chapterCompletionPct === 20.0, `Chemistry completion % is 20.0% (got ${statsB.subjects.chemistry.chapterCompletionPct}%)`);
assert(statsB.subjects.maths.completedChapters === 0, 'Maths completed 0/13 (0%)');
assert(statsB.subjects.maths.chapterCompletionPct === 0, 'Maths completion % is 0%');

// ----------------------------------------------------
// SCENARIO C: 20 Chapters Completed
// ----------------------------------------------------
console.log('\n--- SCENARIO C: 20 Chapters Completed ---');
const progressC: Record<string, ChapterProgress> = {};
for (let i = 0; i < 20; i++) {
  const ch = SYLLABUS[i];
  progressC[ch.id] = { id: ch.id, is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: true, is_weak: false, notes: '' };
}
const statsC = calculateDashboardStats(progressC, baseConfig, undefined, undefined, fixedNow);

assert(statsC.completedChapters === 20, 'Completed chapters is 20');
assert(statsC.remainingChapters === 17, 'Remaining chapters is 17');
assert(statsC.overallCompletionPct === 54.1, `Overall completion % is 54.1% (got ${statsC.overallCompletionPct}%)`);
assert(statsC.requiredPaceChaptersPerDay === 0.27, `Required pace is 0.27 ch/day (got ${statsC.requiredPaceChaptersPerDay})`);
assert(statsC.daysPerChapterRequired === 3.7, `Days per chapter relaxed to 3.7d (got ${statsC.daysPerChapterRequired})`);

// ----------------------------------------------------
// SCENARIO D: 37/37 Chapters Completed (100% Finish)
// ----------------------------------------------------
console.log('\n--- SCENARIO D: 37/37 Chapters Completed (Full Syllabus) ---');
const progressD: Record<string, ChapterProgress> = {};
for (const ch of SYLLABUS) {
  progressD[ch.id] = { id: ch.id, is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: true, is_weak: false, notes: '' };
}
const statsD = calculateDashboardStats(progressD, baseConfig, undefined, undefined, fixedNow);

assert(statsD.completedChapters === 37, 'Completed chapters is 37');
assert(statsD.remainingChapters === 0, 'Remaining chapters is 0');
assert(statsD.overallCompletionPct === 100, 'Overall completion % is 100%');
assert(statsD.requiredPaceChaptersPerDay === 0, 'Required pace is 0 ch/day');
assert(statsD.daysPerChapterRequired === 0, 'Days per chapter required is 0');
assert(statsD.paceStatus === 'COMPLETED', `Pace status is COMPLETED (got ${statsD.paceStatus})`);

// ----------------------------------------------------
// SCENARIO E: Unchecking / Reverting a Chapter
// ----------------------------------------------------
console.log('\n--- SCENARIO E: Dynamic Reactivity on Chapter Uncheck ---');
// Start with 5 chapters, uncheck phy-3 -> should become 4 chapters
const progressE = { ...progressB };
delete progressE['phy-3']; // Unchecked phy-3
const statsE = calculateDashboardStats(progressE, baseConfig, undefined, undefined, fixedNow);

assert(statsE.completedChapters === 4, `Completed chapters decreased from 5 to 4 (got ${statsE.completedChapters})`);
assert(statsE.remainingChapters === 33, `Remaining chapters increased from 32 to 33 (got ${statsE.remainingChapters})`);
assert(statsE.requiredPaceChaptersPerDay === 0.53, `Required pace increased back to 0.53 ch/day (got ${statsE.requiredPaceChaptersPerDay})`);

// ----------------------------------------------------
// SCENARIO F: Deadline Configuration Update
// ----------------------------------------------------
console.log('\n--- SCENARIO F: Deadline Config Update (Oct 31 deadline) ---');
const earlierConfig: AppConfig = {
  ...baseConfig,
  syllabusDeadline: '2026-10-31', // 47 days away instead of 62
};
const statsF = calculateDashboardStats(progressA, earlierConfig, undefined, undefined, fixedNow);
assert(statsF.daysToSyllabusDeadline === 47, `Days to deadline is 47 (got ${statsF.daysToSyllabusDeadline})`);
assert(statsF.requiredPaceChaptersPerDay === 0.79, `Required pace increased from 0.60 to 0.79 ch/day (got ${statsF.requiredPaceChaptersPerDay})`);
assert(statsF.revisionWindowDays === 97, `Revision window increased to 97 days (got ${statsF.revisionWindowDays})`);

// ----------------------------------------------------
// SCENARIO G: Subtasks Independence & Discrete Statuses
// ----------------------------------------------------
console.log('\n--- SCENARIO G: Subtask Independence & Discrete Statuses ---');
const progressG: Record<string, ChapterProgress> = {
  // Not started
  'phy-1': { id: 'phy-1', is_completed: false, completed_at: null, syllabus_done: false, questions_done: false, test_done: false, revision_done: false, is_weak: false, notes: '' },
  // In progress (only syllabus read)
  'phy-2': { id: 'phy-2', is_completed: false, completed_at: null, syllabus_done: true, questions_done: false, test_done: false, revision_done: false, is_weak: false, notes: '' },
  // Weak chapter
  'phy-3': { id: 'phy-3', is_completed: false, completed_at: null, syllabus_done: true, questions_done: false, test_done: false, revision_done: false, is_weak: true, notes: 'Need more practice' },
  // Completed but needs revision
  'phy-4': { id: 'phy-4', is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: false, is_weak: false, notes: '' },
  // Fully completed
  'phy-5': { id: 'phy-5', is_completed: true, completed_at: '2026-09-14T08:00:00', syllabus_done: true, questions_done: true, test_done: true, revision_done: true, is_weak: false, notes: '' },
};

assert(calculateChapterStatus('phy-1', progressG) === 'not_started', 'phy-1 is not_started');
assert(calculateChapterStatus('phy-2', progressG) === 'in_progress', 'phy-2 is in_progress');
assert(calculateChapterStatus('phy-3', progressG) === 'weak', 'phy-3 is weak');
assert(calculateChapterStatus('phy-4', progressG) === 'needs_revision', 'phy-4 is needs_revision');
assert(calculateChapterStatus('phy-5', progressG) === 'completed', 'phy-5 is completed');

const statsG = calculateDashboardStats(progressG, baseConfig, undefined, undefined, fixedNow);
// Subtasks done: phy-2(1) + phy-3(1) + phy-4(3) + phy-5(4) = 9 tasks done
assert(statsG.completedTasks === 9, `Completed tasks is 9 (got ${statsG.completedTasks})`);
assert(statsG.completedChapters === 2, `Completed chapters is 2 (only phy-4 and phy-5 marked complete) (got ${statsG.completedChapters})`);

// ----------------------------------------------------
// SCENARIO H: Multi-Syllabus Presets (Class 11 & JEE)
// ----------------------------------------------------
console.log('\n--- SCENARIO H: Multi-Syllabus Presets (Class 11 & JEE) ---');
const config11: AppConfig = {
  ...baseConfig,
  gradePreset: 'cbse-11-pcm',
};
const stats11 = calculateDashboardStats({}, config11, undefined, undefined, fixedNow);
assert(stats11.totalChapters === 37, `Class 11 has 37 total chapters (got ${stats11.totalChapters})`);
assert(stats11.subjects.physics.totalChapters === 14, `Class 11 Physics has 14 chapters (got ${stats11.subjects.physics.totalChapters})`);
assert(stats11.subjects.chemistry.totalChapters === 9, `Class 11 Chemistry has 9 chapters (got ${stats11.subjects.chemistry.totalChapters})`);
assert(stats11.subjects.maths.totalChapters === 14, `Class 11 Maths has 14 chapters (got ${stats11.subjects.maths.totalChapters})`);

const configJEE: AppConfig = {
  ...baseConfig,
  gradePreset: 'jee-pcm',
};
const statsJEE = calculateDashboardStats({}, configJEE, undefined, undefined, fixedNow);
assert(statsJEE.totalChapters === 74, `JEE Main has 74 total chapters (got ${statsJEE.totalChapters})`);
assert(statsJEE.subjects.physics.totalChapters === 28, `JEE Physics has 28 chapters (got ${statsJEE.subjects.physics.totalChapters})`);
assert(statsJEE.subjects.chemistry.totalChapters === 19, `JEE Chemistry has 19 chapters (got ${statsJEE.subjects.chemistry.totalChapters})`);
assert(statsJEE.subjects.maths.totalChapters === 27, `JEE Maths has 27 chapters (got ${statsJEE.subjects.maths.totalChapters})`);

// ----------------------------------------------------
// SCENARIO I: Dynamic Custom Chapters Addition
// ----------------------------------------------------
console.log('\n--- SCENARIO I: Dynamic Custom Chapter Addition ---');
const customChapter = {
  id: 'custom-physics-test',
  subject: 'physics' as const,
  unit: 'Coaching Advanced Mechanics',
  name: 'Fluid Dynamics Olympiad Level',
  marks: 6,
  priority: 'must-do' as const,
  priorityLabel: 'Advanced',
};
const statsCustom = calculateDashboardStats({}, baseConfig, undefined, undefined, fixedNow, [...SYLLABUS, customChapter]);
assert(statsCustom.totalChapters === 38, `Custom syllabus has 38 chapters (got ${statsCustom.totalChapters})`);
assert(statsCustom.subjects.physics.totalChapters === 15, `Physics has 15 chapters (got ${statsCustom.subjects.physics.totalChapters})`);
assert(statsCustom.remainingChapters === 38, 'Remaining chapters is 38');

console.log(`\n========================================================`);
console.log(`RESULT: ${passedCount} / ${totalCount} PASSED`);
console.log(`========================================================`);

if (passedCount !== totalCount) {
  process.exit(1);
}
