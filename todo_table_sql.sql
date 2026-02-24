-- 创建 todos 表
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);

-- 创建 updated_at 自动更新的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许用户读取自己的 todos
CREATE POLICY "用户只能读取自己的 todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

-- 创建策略：允许用户插入自己的 todos
CREATE POLICY "用户只能插入自己的 todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建策略：允许用户更新自己的 todos
CREATE POLICY "用户只能更新自己的 todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建策略：允许用户删除自己的 todos
CREATE POLICY "用户只能删除自己的 todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- 注意：示例数据需要替换为实际的用户ID
-- 插入一些示例数据（可选）- 需要替换YOUR_USER_ID为实际用户ID
-- INSERT INTO todos (user_id, title, description, completed) VALUES
--   ('YOUR_USER_ID', '学习 Next.js', '掌握 Next.js 14 的新特性', false),
--   ('YOUR_USER_ID', '集成 Supabase', '将 Supabase 集成到项目中', true),
--   ('YOUR_USER_ID', '部署应用', '将应用部署到 Vercel', false),
--   ('YOUR_USER_ID', '编写文档', '为项目编写详细文档', false),
--   ('YOUR_USER_ID', '测试功能', '测试所有功能是否正常工作', true)
-- ON CONFLICT (id) DO NOTHING;