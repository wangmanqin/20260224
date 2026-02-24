-- Supabase Storage 设置脚本
-- 用于创建和管理 temp_1 bucket

-- 注意：以下操作需要在 Supabase 控制台的 SQL 编辑器中执行
-- 或者使用 Supabase CLI 执行

-- ============================================
-- 1. 创建存储桶 (如果不存在)
-- ============================================

-- 方法1: 使用 Supabase Dashboard 创建
-- 1. 进入 Storage → Create new bucket
-- 2. 名称: temp_1
-- 3. 权限: Public (公开访问)
-- 4. 文件大小限制: 根据需求设置 (默认 50MB)
-- 5. 点击 Create bucket

-- 方法2: 使用 SQL (需要适当的权限)
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp_1', 'temp_1', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;
*/

-- ============================================
-- 2. 设置存储桶权限策略
-- ============================================

-- 允许所有人读取文件 (因为 bucket 是 public 的)
CREATE POLICY "允许所有人读取 temp_1 文件"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp_1');

-- 允许认证用户上传文件到 temp_1
CREATE POLICY "允许认证用户上传到 temp_1"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'temp_1' AND
  auth.role() = 'authenticated'
);

-- 允许认证用户更新自己的文件
CREATE POLICY "允许认证用户更新 temp_1 文件"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'temp_1' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'temp_1' AND
  auth.role() = 'authenticated'
);

-- 允许认证用户删除自己的文件
CREATE POLICY "允许认证用户删除 temp_1 文件"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'temp_1' AND
  auth.role() = 'authenticated'
);

-- ============================================
-- 3. 可选：创建文件夹结构
-- ============================================

-- 注意：在 Supabase Storage 中，文件夹是通过上传文件到特定路径创建的
-- 例如，要创建 "documents" 文件夹，可以上传一个文件到 "documents/example.txt"

-- ============================================
-- 4. 测试数据 (可选)
-- ============================================

-- 上传测试文件到存储桶的示例代码 (需要在应用代码中执行)：
/*
// JavaScript/TypeScript 示例
const { data, error } = await supabase.storage
  .from('temp_1')
  .upload('welcome.txt', '欢迎使用 Supabase 云盘！')

if (error) {
  console.error('上传测试文件失败:', error)
} else {
  console.log('测试文件上传成功:', data)
}
*/

-- ============================================
-- 5. 验证设置
-- ============================================

-- 检查存储桶是否存在
SELECT * FROM storage.buckets WHERE id = 'temp_1';

-- 检查权限策略
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================
-- 6. 清理脚本 (如果需要)
-- ============================================

-- 删除权限策略
/*
DROP POLICY IF EXISTS "允许所有人读取 temp_1 文件" ON storage.objects;
DROP POLICY IF EXISTS "允许认证用户上传到 temp_1" ON storage.objects;
DROP POLICY IF EXISTS "允许认证用户更新 temp_1 文件" ON storage.objects;
DROP POLICY IF EXISTS "允许认证用户删除 temp_1 文件" ON storage.objects;
*/

-- 删除存储桶 (注意：这会删除桶中的所有文件)
/*
DELETE FROM storage.buckets WHERE id = 'temp_1';
*/

-- ============================================
-- 7. 使用说明
-- ============================================

/*
1. 在 Supabase Dashboard 中创建 temp_1 bucket:
   - 进入 Storage 页面
   - 点击 "Create new bucket"
   - 名称: temp_1
   - 权限: Public
   - 点击 Create

2. 运行权限策略 SQL:
   - 复制上面的 CREATE POLICY 语句
   - 在 SQL 编辑器中执行

3. 测试功能:
   - 访问 /storage 页面
   - 尝试上传、下载、删除文件
*/

-- ============================================
-- 8. 高级配置 (可选)
-- ============================================

-- 设置文件大小限制 (单位: 字节)
-- 默认是 50MB (52428800 字节)
-- 可以在 Supabase Dashboard 的存储桶设置中修改

-- 设置允许的文件类型
-- 可以在应用代码中验证文件类型

-- 设置 CORS 策略 (如果需要从不同域名访问)
-- 可以在 Supabase Dashboard 的存储桶设置中配置

-- ============================================
-- 9. 安全建议
-- ============================================

/*
1. 对于生产环境，考虑使用私有存储桶
2. 实现文件类型验证
3. 设置合理的文件大小限制
4. 定期清理不需要的文件
5. 监控存储使用情况
6. 实现病毒扫描 (对于用户上传的文件)
*/

-- ============================================
-- 10. 故障排除
-- ============================================

/*
常见问题:
1. "Bucket not found" - 存储桶未创建
2. "Permission denied" - 权限策略未正确设置
3. "File too large" - 文件超过大小限制
4. "Invalid file type" - 文件类型不被允许

解决方案:
1. 确认存储桶已创建且名称正确
2. 检查并运行权限策略 SQL
3. 调整文件大小限制或压缩文件
4. 在应用代码中实现文件类型验证
*/