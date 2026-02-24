-- 创建 todos 表
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 创建策略：允许所有用户读取 todos
CREATE POLICY "允许所有人读取 todos" ON todos
  FOR SELECT USING (true);

-- 创建策略：允许所有用户插入 todos
CREATE POLICY "允许所有人插入 todos" ON todos
  FOR INSERT WITH CHECK (true);

-- 创建策略：允许所有用户更新 todos
CREATE POLICY "允许所有人更新 todos" ON todos
  FOR UPDATE USING (true);

-- 创建策略：允许所有用户删除 todos
CREATE POLICY "允许所有人删除 todos" ON todos
  FOR DELETE USING (true);

-- 插入一些示例数据（可选）
INSERT INTO todos (title, description, completed) VALUES
  ('学习 Next.js', '掌握 Next.js 14 的新特性', false),
  ('集成 Supabase', '将 Supabase 集成到项目中', true),
  ('部署应用', '将应用部署到 Vercel', false),
  ('编写文档', '为项目编写详细文档', false),
  ('测试功能', '测试所有功能是否正常工作', true)
ON CONFLICT (id) DO NOTHING;