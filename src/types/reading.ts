/**
 * 阅读模块类型定义
 */

export type DocumentFormat = "pdf" | "epub" | "txt";
export type HighlightType = "highlight" | "underline" | "strikethrough";
export type HighlightColor = "#FFEB3B" | "#A5D6A7" | "#90CAF9" | "#F48FB1" | "#CE93D8";
export type ReaderTheme = "light" | "sepia" | "dark" | "green";
export type PageMargin = "narrow" | "medium" | "wide";

/** 阅读进度 */
export interface ReadingProgress {
  id: string;
  user_id: string;
  file_id: string;
  document_format: DocumentFormat;
  current_position: ReadingPosition;
  total_progress: number; // 0-100
  total_reading_time: number; // 累计秒数
  last_read_at: string;
  is_finished: boolean;
  created_at: string;
  updated_at: string;
}

/** 阅读位置（不同格式不同结构） */
export interface ReadingPosition {
  // PDF
  pageNumber?: number;
  zoom?: number;
  // EPUB
  cfi?: string;
  // TXT
  paragraphIndex?: number;
  scrollTop?: number;
}

/** 高亮批注 */
export interface Highlight {
  id: string;
  user_id: string;
  file_id: string;
  document_format: DocumentFormat;
  highlight_type: HighlightType;
  color: HighlightColor;
  position: HighlightPosition;
  text_content: string;
  note: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/** 高亮位置（不同格式不同结构） */
export interface HighlightPosition {
  // PDF
  pageNumber?: number;
  rects?: Array<{ x: number; y: number; width: number; height: number }>;
  // EPUB
  cfiRange?: string;
  // TXT
  paragraphIndex?: number;
  startOffset?: number;
  endOffset?: number;
}

/** 书签 */
export interface Bookmark {
  id: string;
  user_id: string;
  file_id: string;
  title: string;
  position: ReadingPosition;
  is_auto: boolean;
  created_at: string;
}

/** 笔记 */
export interface Note {
  id: string;
  user_id: string;
  file_id: string | null;
  highlight_id: string | null;
  title: string | null;
  content: string; // Markdown
  tags: string[];
  source_text: string | null;
  source_position: HighlightPosition | null;
  created_at: string;
  updated_at: string;
  // 关联
  file?: { id: string; original_name: string };
  highlight?: Highlight;
}

/** 生词 */
export interface Vocabulary {
  id: string;
  user_id: string;
  file_id: string | null;
  word: string;
  phonetic: string | null;
  definition: string | null;
  example_sentence: string | null;
  translation: string | null;
  context: string | null;
  proficiency: 0 | 1 | 2; // 0=生疏, 1=熟悉, 2=掌握
  is_in_flashcards: boolean;
  created_at: string;
  updated_at: string;
}

/** 闪卡 */
export interface Flashcard {
  id: string;
  user_id: string;
  vocabulary_id: string;
  front_content: string;
  back_content: string;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // 关联
  vocabulary?: Vocabulary;
}

/** 阅读会话 */
export interface ReadingSession {
  id: string;
  user_id: string;
  file_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  pages_read: number;
}

/** 阅读设置 */
export interface ReadingSettings {
  id: string;
  user_id: string;
  theme: ReaderTheme;
  font_size: number;
  line_height: number;
  letter_spacing: number;
  font_family: string;
  default_highlight_color: HighlightColor;
  page_margin: PageMargin;
  reading_goal_minutes: number;
  created_at: string;
  updated_at: string;
}

/** 阅读统计数据 */
export interface ReadingStats {
  todayReadingTime: number;
  weekReadingTime: number;
  monthReadingTime: number;
  totalReadingTime: number;
  finishedBooks: number;
  totalBooks: number;
  currentStreak: number;
  dailyData: Array<{ date: string; minutes: number }>;
  recentReading: Array<{
    file_id: string;
    file_name: string;
    progress: number;
    last_read_at: string;
    reading_time: number;
  }>;
}

/** 词典查询结果 */
export interface DictionaryResult {
  word: string;
  phonetic: string | null;
  definition: string;
  translation: string;
  examples: string[];
}

/** SM-2 闪卡复习评分 */
export type ReviewGrade = 1 | 2 | 3 | 4; // 1=忘记, 2=困难, 3=良好, 4=简单

/** SM-2 算法更新结果 */
export interface SM2Result {
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_at: string;
}
