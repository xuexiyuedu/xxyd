-- ============================================
-- 知识阅读平台 - 完整建表 SQL
-- 复制到 Supabase → SQL Editor 执行
-- ============================================

-- 用户扩展信息表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  avatar_url TEXT,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 文件表
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  storage_key VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('pdf','epub','txt','image','video','audio','document','archive','other')),
  mime_type VARCHAR(200),
  category_id UUID,
  description TEXT,
  download_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  access_password TEXT,
  share_token VARCHAR(32) UNIQUE,
  share_expires_at TIMESTAMPTZ,
  version INT DEFAULT 1,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 分类表
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  icon VARCHAR(50),
  color VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 标签表
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 文件标签关联表
CREATE TABLE IF NOT EXISTS public.file_tags (
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (file_id, tag_id)
);

-- 分享链接表
CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  max_downloads INT,
  download_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 访问日志表
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  visitor_ip VARCHAR(45),
  visitor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view','download','share')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 阅读进度表
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  document_format VARCHAR(10) NOT NULL CHECK (document_format IN ('pdf','epub','txt')),
  current_position JSONB NOT NULL DEFAULT '{}',
  total_progress INT DEFAULT 0,
  total_reading_time INT DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  is_finished BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, file_id)
);

-- 高亮批注表
CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  document_format VARCHAR(10) NOT NULL,
  highlight_type VARCHAR(20) NOT NULL CHECK (highlight_type IN ('highlight','underline','strikethrough')),
  color VARCHAR(7) NOT NULL DEFAULT '#FFEB3B',
  position JSONB NOT NULL DEFAULT '{}',
  text_content TEXT,
  note TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 书签表
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  position JSONB NOT NULL DEFAULT '{}',
  is_auto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 笔记表
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE SET NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  source_text TEXT,
  source_position JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 生词本表
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  word VARCHAR(255) NOT NULL,
  phonetic VARCHAR(255),
  definition TEXT,
  example_sentence TEXT,
  translation TEXT,
  context TEXT,
  proficiency INT DEFAULT 0 CHECK (proficiency IN (0,1,2)),
  is_in_flashcards BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 闪卡表
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  vocabulary_id UUID REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  front_content TEXT NOT NULL,
  back_content TEXT NOT NULL,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval_days INT DEFAULT 0,
  repetition_count INT DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 阅读会话表
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  pages_read INT DEFAULT 0
);

-- 阅读设置表
CREATE TABLE IF NOT EXISTS public.reading_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme VARCHAR(20) DEFAULT 'light',
  font_size INT DEFAULT 16,
  line_height DECIMAL(3,2) DEFAULT 1.6,
  letter_spacing DECIMAL(3,2) DEFAULT 0,
  font_family VARCHAR(255) DEFAULT 'system-ui',
  default_highlight_color VARCHAR(7) DEFAULT '#FFEB3B',
  page_margin VARCHAR(20) DEFAULT 'medium',
  reading_goal_minutes INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 索引
-- ===========================
CREATE INDEX IF NOT EXISTS idx_files_user ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_share_token ON public.files(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_file ON public.share_links(file_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON public.reading_progress(user_id, last_read_at DESC);
CREATE INDEX IF NOT EXISTS idx_highlights_user_file ON public.highlights(user_id, file_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_file ON public.bookmarks(user_id, file_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_file ON public.notes(user_id, file_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user ON public.vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_review ON public.flashcards(user_id, next_review_at);

-- ===========================
-- 触发器：自动更新 updated_at
-- ===========================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 先删后建（PostgreSQL 不支持 CREATE TRIGGER IF NOT EXISTS）
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_files_updated_at ON public.files;
CREATE TRIGGER trigger_files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_share_links_updated_at ON public.share_links;
CREATE TRIGGER trigger_share_links_updated_at BEFORE UPDATE ON public.share_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_reading_progress_updated_at ON public.reading_progress;
CREATE TRIGGER trigger_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_highlights_updated_at ON public.highlights;
CREATE TRIGGER trigger_highlights_updated_at BEFORE UPDATE ON public.highlights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_notes_updated_at ON public.notes;
CREATE TRIGGER trigger_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_vocabulary_updated_at ON public.vocabulary;
CREATE TRIGGER trigger_vocabulary_updated_at BEFORE UPDATE ON public.vocabulary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_flashcards_updated_at ON public.flashcards;
CREATE TRIGGER trigger_flashcards_updated_at BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_reading_settings_updated_at ON public.reading_settings;
CREATE TRIGGER trigger_reading_settings_updated_at BEFORE UPDATE ON public.reading_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 新用户注册时自动创建 users + reading_settings 记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.reading_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================
-- RLS 策略
-- ===========================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_settings ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "用户查看自己" ON public.users;
CREATE POLICY "用户查看自己" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "用户更新自己" ON public.users;
CREATE POLICY "用户更新自己" ON public.users FOR UPDATE USING (auth.uid() = id);

-- files
DROP POLICY IF EXISTS "用户查看自己或公开文件" ON public.files;
CREATE POLICY "用户查看自己或公开文件" ON public.files FOR SELECT USING (auth.uid() = user_id OR is_public = true);
DROP POLICY IF EXISTS "用户创建文件" ON public.files;
CREATE POLICY "用户创建文件" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户更新自己文件" ON public.files;
CREATE POLICY "用户更新自己文件" ON public.files FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户删除自己文件" ON public.files;
CREATE POLICY "用户删除自己文件" ON public.files FOR DELETE USING (auth.uid() = user_id);

-- share_links
DROP POLICY IF EXISTS "用户管理自己分享链接" ON public.share_links;
CREATE POLICY "用户管理自己分享链接" ON public.share_links FOR ALL USING (auth.uid() = created_by);

-- categories / tags
DROP POLICY IF EXISTS "用户管理自己分类" ON public.categories;
CREATE POLICY "用户管理自己分类" ON public.categories FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户管理自己标签" ON public.tags;
CREATE POLICY "用户管理自己标签" ON public.tags FOR ALL USING (auth.uid() = user_id);

-- reading
DROP POLICY IF EXISTS "用户管理自己阅读进度" ON public.reading_progress;
CREATE POLICY "用户管理自己阅读进度" ON public.reading_progress FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户管理自己高亮" ON public.highlights;
CREATE POLICY "用户管理自己高亮" ON public.highlights FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户管理自己书签" ON public.bookmarks;
CREATE POLICY "用户管理自己书签" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户管理自己笔记" ON public.notes;
CREATE POLICY "用户管理自己笔记" ON public.notes FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户管理自己生词" ON public.vocabulary;
CREATE POLICY "用户管理自己生词" ON public.vocabulary FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户管理自己闪卡" ON public.flashcards;
CREATE POLICY "用户管理自己闪卡" ON public.flashcards FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户管理自己阅读会话" ON public.reading_sessions;
CREATE POLICY "用户管理自己阅读会话" ON public.reading_sessions FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "用户管理自己阅读设置" ON public.reading_settings;
CREATE POLICY "用户管理自己阅读设置" ON public.reading_settings FOR ALL USING (auth.uid() = user_id);

-- access_logs
DROP POLICY IF EXISTS "用户查看自己文件访问日志" ON public.access_logs;
CREATE POLICY "用户查看自己文件访问日志" ON public.access_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.files WHERE files.id = access_logs.file_id AND files.user_id = auth.uid())
);
