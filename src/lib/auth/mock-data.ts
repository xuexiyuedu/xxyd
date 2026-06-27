/**
 * Mock 数据存储 - 仅在 NEXT_PUBLIC_MOCK_AUTH=true 时使用
 * 使用全局变量保证 Next.js dev server 热更新后数据不丢失
 */

import type { User, Session } from "@supabase/supabase-js";

// ============ 类型定义 ============

interface MockFile {
  id: string;
  user_id: string;
  original_name: string;
  storage_key: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  category_id: string | null;
  description: string | null;
  download_count: number;
  view_count: number;
  is_public: boolean;
  access_password: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  version: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  category?: any;
  tags?: any[];
}

interface MockNote {
  id: string;
  user_id: string;
  file_id: string;
  highlight_id: string | null;
  title: string | null;
  content: string;
  source_text: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  file?: { original_name: string };
  highlight?: any;
}

interface MockHighlight {
  id: string;
  user_id: string;
  file_id: string;
  type: string;
  color: string;
  text: string;
  position: any;
  note: string | null;
  created_at: string;
}

interface MockBookmark {
  id: string;
  user_id: string;
  file_id: string;
  title: string;
  position: any;
  created_at: string;
}

interface MockSession {
  id: string;
  user_id: string;
  file_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  pages_read: number;
}

interface MockProgress {
  id: string;
  user_id: string;
  file_id: string;
  format: string;
  current_position: any;
  total_progress: number;
  is_finished: boolean;
  last_read_at: string;
  total_reading_time: number;
  file?: { original_name: string };
}

interface MockVocabulary {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  phonetic: string | null;
  context: string | null;
  file_id: string | null;
  proficiency: number;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_at: string;
  created_at: string;
}

interface MockFlashcard {
  id: string;
  user_id: string;
  vocabulary_id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_at: string;
  last_reviewed_at: string | null;
}

interface MockSettings {
  id: string;
  user_id: string;
  theme: string;
  font_size: number;
  line_height: number;
  letter_spacing: number;
  font_family: string;
  reading_goal_minutes: number;
}

// ============ Mock 用户 ============

export const MOCK_USER: User = {
  id: "mock-user-001",
  email: "dev@example.com",
  user_metadata: { username: "开发用户" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2025-06-01T00:00:00.000Z",
  role: "authenticated",
  updated_at: new Date().toISOString(),
  identities: [],
} as unknown as User;

export const MOCK_SESSION: Session = {
  access_token: "mock-token",
  refresh_token: "mock-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: MOCK_USER,
} as unknown as Session;

export const MOCK_PROFILE = {
  id: MOCK_USER.id,
  email: "dev@example.com",
  username: "开发用户",
  avatar_url: null,
  storage_used: 15_000_000,
  storage_limit: 1_073_741_824,
  role: "admin",
  created_at: "2025-06-01T00:00:00.000Z",
};

// ============ 示例 TXT 内容 ============

export const MOCK_TXT_CONTENT = `第一章 知识的种子

在信息爆炸的时代，知识不再是稀缺资源，注意力才是。每个人每天都在被海量的信息淹没，但真正能够内化为知识的，却寥寥无几。

知识管理不是简单的收藏和整理，而是一套从输入、处理到输出的完整系统。好的知识管理工具应该帮助你减少摩擦，让记录、思考和回顾变得自然而然。

第二章 阅读的力量

阅读是获取知识最直接的方式。一本好书，往往是作者数十年思考的结晶。当我们阅读时，我们不仅在获取信息，更是在与作者进行一场跨越时空的对话。

主动阅读与被动阅读有着本质的区别。被动阅读是让文字从眼前流过，而主动阅读则是带着问题去探索，在阅读中标记、批注、质疑和联想。

第三章 高效笔记法

康奈尔笔记法将页面分为三个区域：线索栏、笔记栏和总结栏。这种结构化的方式迫使你在记录的同时进行思考和组织。

卡片盒笔记法（Zettelkasten）则更进了一步。它强调每张卡片只记录一个想法，然后通过链接将卡片连接成网。这种方法的核心在于：知识的价值不在于存储，而在于连接。

第四章 间隔重复与记忆

艾宾浩斯遗忘曲线告诉我们，记忆会随时间衰减，但通过在合适的时间间隔复习，可以显著延长记忆的保持时间。

SM-2 算法是间隔重复系统中最经典的算法之一。它根据你对每个知识点的回忆程度，动态调整下一次复习的时间间隔。回忆越轻松，间隔越长；回忆越困难，间隔越短。

第五章 从阅读到写作

阅读是输入，写作是输出。只有经过输出的知识，才是真正内化的知识。写作迫使你理清思路，组织语言，发现自己理解中的漏洞。

最好的学习方式就是教别人。当你能够用简洁的语言向他人解释一个概念时，说明你已经真正掌握了它。

第六章 工具与系统

工具是延伸思维的支架。选择工具时，应该关注它是否减少了你的认知负担，而不是增加了操作复杂度。

一个好的知识管理系统应该具备以下特征：低摩擦输入、灵活的组织方式、强大的检索能力、以及支持间隔重复的复习机制。

结语

知识管理的终极目标不是建立一个完美的数据库，而是培养一个更好的思考者。工具只是手段，思考才是目的。

愿每一位读者都能在知识的海洋中，找到属于自己的航向。`;

// ============ 全局存储 ============

interface MockStore {
  files: MockFile[];
  notes: MockNote[];
  highlights: MockHighlight[];
  bookmarks: MockBookmark[];
  sessions: MockSession[];
  progress: MockProgress[];
  vocabulary: MockVocabulary[];
  flashcards: MockFlashcard[];
  settings: MockSettings[];
  access_logs: any[];
  file_tags: any[];
  categories: any[];
  tags: any[];
  share_links: any[];
}

function createStore(): MockStore {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000).toISOString();

  const files: MockFile[] = [
    {
      id: "file-001",
      user_id: MOCK_USER.id,
      original_name: "知识管理入门指南.txt",
      storage_key: "mock/file-001.txt",
      file_size: MOCK_TXT_CONTENT.length,
      file_type: "txt",
      mime_type: "text/plain",
      category_id: null,
      description: "一本关于知识管理与阅读方法的小册子",
      download_count: 3,
      view_count: 12,
      is_public: false,
      access_password: null,
      share_token: null,
      share_expires_at: null,
      version: 1,
      is_favorite: true,
      created_at: daysAgo(10),
      updated_at: daysAgo(2),
    },
    {
      id: "file-002",
      user_id: MOCK_USER.id,
      original_name: "深度工作.pdf",
      storage_key: "mock/file-002.pdf",
      file_size: 2_400_000,
      file_type: "pdf",
      mime_type: "application/pdf",
      category_id: null,
      description: "Cal Newport 著，探讨在分心世界中专注工作的能力",
      download_count: 1,
      view_count: 8,
      is_public: false,
      access_password: null,
      share_token: null,
      share_expires_at: null,
      version: 1,
      is_favorite: true,
      created_at: daysAgo(7),
      updated_at: daysAgo(1),
    },
    {
      id: "file-003",
      user_id: MOCK_USER.id,
      original_name: "原子习惯.epub",
      storage_key: "mock/file-003.epub",
      file_size: 1_800_000,
      file_type: "epub",
      mime_type: "application/epub+zip",
      category_id: null,
      description: "James Clear 著，微小改变带来巨大成就的实用方法",
      download_count: 0,
      view_count: 5,
      is_public: false,
      access_password: null,
      share_token: null,
      share_expires_at: null,
      version: 1,
      is_favorite: false,
      created_at: daysAgo(5),
      updated_at: daysAgo(5),
    },
    {
      id: "file-004",
      user_id: MOCK_USER.id,
      original_name: "学习笔记模板.txt",
      storage_key: "mock/file-004.txt",
      file_size: 3200,
      file_type: "txt",
      mime_type: "text/plain",
      category_id: null,
      description: "康奈尔笔记法和卡片盒笔记法的模板",
      download_count: 2,
      view_count: 6,
      is_public: false,
      access_password: null,
      share_token: null,
      share_expires_at: null,
      version: 1,
      is_favorite: false,
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
    },
    {
      id: "file-005",
      user_id: MOCK_USER.id,
      original_name: "封面设计.png",
      storage_key: "mock/file-005.png",
      file_size: 560_000,
      file_type: "image",
      mime_type: "image/png",
      category_id: null,
      description: null,
      download_count: 0,
      view_count: 3,
      is_public: false,
      access_password: null,
      share_token: null,
      share_expires_at: null,
      version: 1,
      is_favorite: false,
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
    {
      id: "file-006",
      user_id: MOCK_USER.id,
      original_name: "演讲录音.mp3",
      storage_key: "mock/file-006.mp3",
      file_size: 8_200_000,
      file_type: "audio",
      mime_type: "audio/mpeg",
      category_id: null,
      description: null,
      download_count: 0,
      view_count: 1,
      is_public: false,
      access_password: null,
      share_token: null,
      share_expires_at: null,
      version: 1,
      is_favorite: false,
      created_at: daysAgo(1),
      updated_at: daysAgo(1),
    },
  ];

  const highlights: MockHighlight[] = [
    {
      id: "hl-001",
      user_id: MOCK_USER.id,
      file_id: "file-001",
      type: "highlight",
      color: "yellow",
      text: "知识管理不是简单的收藏和整理，而是一套从输入、处理到输出的完整系统。",
      position: { paragraphIndex: 1, startOffset: 0, endOffset: 38 },
      note: "这句话点明了知识管理的本质——系统性。",
      created_at: daysAgo(8),
    },
    {
      id: "hl-002",
      user_id: MOCK_USER.id,
      file_id: "file-001",
      type: "underline",
      color: "green",
      text: "好的知识管理工具应该帮助你减少摩擦，让记录、思考和回顾变得自然而然。",
      position: { paragraphIndex: 1, startOffset: 40, endOffset: 75 },
      note: null,
      created_at: daysAgo(8),
    },
    {
      id: "hl-003",
      user_id: MOCK_USER.id,
      file_id: "file-001",
      type: "highlight",
      color: "blue",
      text: "主动阅读与被动阅读有着本质的区别。",
      position: { paragraphIndex: 7, startOffset: 0, endOffset: 16 },
      note: "主动阅读 = 带着问题去探索",
      created_at: daysAgo(6),
    },
  ];

  const notes: MockNote[] = [
    {
      id: "note-001",
      user_id: MOCK_USER.id,
      file_id: "file-001",
      highlight_id: "hl-001",
      title: "知识管理的本质",
      content: "知识管理不是囤积信息，而是建立一套从输入到输出的工作流。关键在于减少摩擦：记录要快，整理要轻，回顾要自动。工具的价值不在于功能多，而在于让你自然而然地使用它。",
      source_text: "知识管理不是简单的收藏和整理，而是一套从输入、处理到输出的完整系统。",
      tags: ["知识管理", "方法论"],
      created_at: daysAgo(8),
      updated_at: daysAgo(8),
      file: { original_name: "知识管理入门指南.txt" },
    },
    {
      id: "note-002",
      user_id: MOCK_USER.id,
      file_id: "file-001",
      highlight_id: "hl-003",
      title: "主动阅读的核心",
      content: "主动阅读意味着带着问题去读，在阅读过程中标记、批注、质疑和联想。这和被动地让文字从眼前流过完全不同。主动阅读者会问：这段话和我已知的什么知识有关联？它改变了我什么认知？",
      source_text: "主动阅读与被动阅读有着本质的区别。",
      tags: ["阅读方法"],
      created_at: daysAgo(6),
      updated_at: daysAgo(6),
      file: { original_name: "知识管理入门指南.txt" },
    },
    {
      id: "note-003",
      user_id: MOCK_USER.id,
      file_id: "file-002",
      highlight_id: null,
      title: "深度工作的四个原则",
      content: "1. 将工作深度化：安排专门的深度工作时间段\n2. 拥抱无聊：不要一有空就刷手机\n3. 远离社交媒体：审慎选择工具\n4. 摒弃浮浅：对每项任务的深度做评估",
      source_text: null,
      tags: ["效率", "专注力"],
      created_at: daysAgo(4),
      updated_at: daysAgo(4),
      file: { original_name: "深度工作.pdf" },
    },
  ];

  const bookmarks: MockBookmark[] = [
    {
      id: "bm-001",
      user_id: MOCK_USER.id,
      file_id: "file-001",
      title: "第三章 高效笔记法",
      position: { paragraphIndex: 9 },
      created_at: daysAgo(7),
    },
    {
      id: "bm-002",
      user_id: MOCK_USER.id,
      file_id: "file-001",
      title: "第四章 间隔重复与记忆",
      position: { paragraphIndex: 15 },
      created_at: daysAgo(5),
    },
  ];

  // 生成最近7天的阅读会话
  const sessions: MockSession[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(9, 0, 0, 0);
    sessions.push({
      id: `sess-${i}`,
      user_id: MOCK_USER.id,
      file_id: i % 2 === 0 ? "file-001" : "file-002",
      started_at: date.toISOString(),
      ended_at: new Date(date.getTime() + 1800000).toISOString(),
      duration_seconds: 900 + Math.floor(Math.random() * 1800),
      pages_read: Math.floor(Math.random() * 10) + 2,
    });
  }
  // 今天的会话
  sessions.push({
    id: "sess-today",
    user_id: MOCK_USER.id,
    file_id: "file-001",
    started_at: hoursAgo(2),
    ended_at: hoursAgo(1),
    duration_seconds: 1200,
    pages_read: 5,
  });

  const progress: MockProgress[] = [
    {
      id: "prog-001",
      user_id: MOCK_USER.id,
      file_id: "file-001",
      format: "txt",
      current_position: { paragraphIndex: 15 },
      total_progress: 65,
      is_finished: false,
      last_read_at: hoursAgo(1),
      total_reading_time: 3600,
      file: { original_name: "知识管理入门指南.txt" },
    },
    {
      id: "prog-002",
      user_id: MOCK_USER.id,
      file_id: "file-002",
      format: "pdf",
      current_position: { page: 45 },
      total_progress: 30,
      is_finished: false,
      last_read_at: hoursAgo(20),
      total_reading_time: 2400,
      file: { original_name: "深度工作.pdf" },
    },
    {
      id: "prog-003",
      user_id: MOCK_USER.id,
      file_id: "file-003",
      format: "epub",
      current_position: { cfi: "epubcfi(/6/8!/4/2)" },
      total_progress: 100,
      is_finished: true,
      last_read_at: daysAgo(2),
      total_reading_time: 7200,
      file: { original_name: "原子习惯.epub" },
    },
  ];

  const vocabulary: MockVocabulary[] = [
    {
      id: "voc-001",
      user_id: MOCK_USER.id,
      word: "friction",
      translation: "摩擦力；阻力",
      phonetic: "/ˈfrɪkʃən/",
      context: "good tools should help you reduce friction",
      file_id: "file-001",
      proficiency: 3,
      ease_factor: 2.5,
      interval_days: 4,
      repetition_count: 3,
      next_review_at: new Date(now.getTime() + 86400000).toISOString(),
      created_at: daysAgo(8),
    },
    {
      id: "voc-002",
      user_id: MOCK_USER.id,
      word: "internalize",
      translation: "使内化；使变成内在的",
      phonetic: "/ɪnˈtɜːrnəlaɪz/",
      context: "only knowledge that has been output is truly internalized",
      file_id: "file-001",
      proficiency: 2,
      ease_factor: 2.3,
      interval_days: 1,
      repetition_count: 2,
      next_review_at: new Date(now.getTime() - 3600000).toISOString(), // 已到期
      created_at: daysAgo(5),
    },
    {
      id: "voc-003",
      user_id: MOCK_USER.id,
      word: "spaced repetition",
      translation: "间隔重复",
      phonetic: "/speɪst rɪˈpɪtɪʃən/",
      context: "SM-2 algorithm is used in spaced repetition systems",
      file_id: "file-001",
      proficiency: 4,
      ease_factor: 2.6,
      interval_days: 7,
      repetition_count: 5,
      next_review_at: new Date(now.getTime() + 3 * 86400000).toISOString(),
      created_at: daysAgo(10),
    },
  ];

  const flashcards: MockFlashcard[] = vocabulary.map((v) => ({
    id: `fc-${v.id}`,
    user_id: MOCK_USER.id,
    vocabulary_id: v.id,
    front: v.word,
    back: v.translation,
    ease_factor: v.ease_factor,
    interval_days: v.interval_days,
    repetition_count: v.repetition_count,
    next_review_at: v.next_review_at,
    last_reviewed_at: daysAgo(1),
  }));

  const settings: MockSettings[] = [{
    id: "settings-001",
    user_id: MOCK_USER.id,
    theme: "sepia",
    font_size: 18,
    line_height: 1.8,
    letter_spacing: 0,
    font_family: "sans-serif",
    reading_goal_minutes: 30,
  }];

  return {
    files,
    notes,
    highlights,
    bookmarks,
    sessions,
    progress,
    vocabulary,
    flashcards,
    settings,
    access_logs: [],
    file_tags: [],
    categories: [
      { id: "cat-001", user_id: MOCK_USER.id, parent_id: null, name: "技术文档", sort_order: 0, icon: null, color: "#3b82f6", created_at: daysAgo(30) },
      { id: "cat-002", user_id: MOCK_USER.id, parent_id: null, name: "读书笔记", sort_order: 1, icon: null, color: "#10b981", created_at: daysAgo(30) },
    ],
    tags: [
      { id: "tag-001", user_id: MOCK_USER.id, name: "知识管理", color: "#f59e0b", created_at: daysAgo(30) },
      { id: "tag-002", user_id: MOCK_USER.id, name: "方法论", color: "#8b5cf6", created_at: daysAgo(30) },
    ],
    share_links: [
      {
        id: "share-001",
        file_id: "file-001",
        user_id: MOCK_USER.id,
        token: "demo-share-001",
        password: null,
        expires_at: null,
        download_limit: null,
        download_count: 3,
        view_count: 12,
        is_active: true,
        created_at: daysAgo(7),
        updated_at: daysAgo(7),
      },
      {
        id: "share-002",
        file_id: "file-002",
        user_id: MOCK_USER.id,
        token: "demo-share-002",
        password: "mock:123456",
        expires_at: hoursAgo(-72), // 3 天后过期
        download_limit: 10,
        download_count: 2,
        view_count: 5,
        is_active: true,
        created_at: daysAgo(2),
        updated_at: daysAgo(2),
      },
    ],
  };
}

// 使用 globalThis 保证热更新不丢数据
const globalForMock = globalThis as unknown as { __mockStore?: MockStore };

export function getMockStore(): MockStore {
  if (!globalForMock.__mockStore) {
    globalForMock.__mockStore = createStore();
  }
  return globalForMock.__mockStore;
}

export function resetMockStore() {
  globalForMock.__mockStore = createStore();
}
