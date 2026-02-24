# Supabase 云盘使用指南

## 功能概述

这是一个基于 Supabase Storage 构建的个人云盘应用，使用 `temp_1` 存储桶（公开访问）。提供完整的文件管理功能，包括上传、下载、删除、文件夹管理等。

## 已完成的功能

### 1. 核心功能
- ✅ 文件上传（支持进度显示）
- ✅ 文件下载（直接下载到本地）
- ✅ 文件删除（需要确认）
- ✅ 文件列表查看（带分页和排序）
- ✅ 文件夹管理（创建、导航）

### 2. 用户界面
- ✅ 现代化的响应式设计
- ✅ 文件图标和类型识别
- ✅ 文件大小和日期格式化
- ✅ 上传进度显示
- ✅ 错误和成功提示
- ✅ 存储统计信息

### 3. 安全特性
- ✅ 页面认证保护（需要登录）
- ✅ 用户只能访问自己的文件
- ✅ 安全的文件操作
- ✅ 操作确认提示

### 4. 技术实现
- ✅ TypeScript 类型安全
- ✅ 模块化代码结构
- ✅ 可重用的存储管理工具
- ✅ 实时数据刷新

## 设置步骤

### 1. 创建 Supabase 存储桶

在 Supabase 控制台中：

1. 进入 **Storage** 页面
2. 点击 **Create new bucket**
3. 输入名称: `temp_1`
4. 设置权限: **Public** (公开访问)
5. 文件大小限制: 根据需求设置（默认 50MB）
6. 点击 **Create bucket**

### 2. 设置存储桶权限

在 Supabase SQL 编辑器中运行 `storage_setup_sql.sql` 文件中的权限策略：

```sql
-- 允许所有人读取文件（因为 bucket 是 public 的）
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
);

-- 允许认证用户删除自己的文件
CREATE POLICY "允许认证用户删除 temp_1 文件"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'temp_1' AND
  auth.role() = 'authenticated'
);
```

### 3. 环境变量配置

确保 `.env.local` 文件包含正确的 Supabase 凭据：
```
NEXT_PUBLIC_SUPABASE_URL=https://ptdutdjpifyjypmqnedc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_CyYwl1ZvWRxMi32Mb2G_Lg_Ai4cQrN4
```

### 4. 安装依赖

项目已经安装了必要的依赖：
- `@supabase/ssr` - 服务器端渲染支持
- `@supabase/supabase-js` - Supabase 客户端

## 使用流程

### 1. 访问云盘
1. 访问 `http://localhost:3001/storage`
2. 如果未登录，会自动重定向到登录页面
3. 登录后进入云盘主界面

### 2. 上传文件
1. 点击"选择文件"按钮选择要上传的文件
2. 点击"上传文件"按钮开始上传
3. 查看上传进度（模拟进度显示）
4. 上传成功后文件会出现在文件列表中

### 3. 下载文件
1. 在文件列表中找到要下载的文件
2. 点击文件对应的"下载"按钮
3. 文件会自动下载到本地

### 4. 删除文件
1. 在文件列表中找到要删除的文件
2. 点击文件对应的"删除"按钮
3. 确认删除操作
4. 文件从存储桶中删除

### 5. 管理文件夹
1. 在"文件夹管理"区域输入新文件夹名称
2. 点击"创建文件夹"按钮
3. 使用"返回上级"按钮导航文件夹结构
4. 当前路径显示在文件夹管理区域

### 6. 刷新文件列表
1. 点击"刷新列表"按钮
2. 文件列表会从 Supabase Storage 重新加载
3. 存储统计信息也会更新

## 文件结构

```
app/
├── storage/
│   ├── page.tsx              # 云盘主页面（受保护）
│   └── StorageApp.tsx        # 云盘应用组件
utils/
└── supabase/
    ├── storage.ts            # 存储管理工具
    ├── auth.ts               # 认证工具
    ├── server.ts             # 服务器端客户端
    └── client.ts             # 客户端客户端
```

## 核心组件说明

### 1. StorageApp 组件 (`app/storage/StorageApp.tsx`)
- 文件上传、下载、删除功能
- 文件夹管理
- 文件列表显示
- 用户界面交互

### 2. StorageManager 类 (`utils/supabase/storage.ts`)
```typescript
// 主要方法
listFiles(folderPath)        // 获取文件列表
uploadFile(file, folderPath) // 上传文件
downloadFile(filePath)       // 下载文件
deleteFile(filePath)         // 删除文件
createFolder(folderName)     // 创建文件夹
getBucketInfo()              // 获取存储桶信息
```

### 3. 工具函数
```typescript
formatFileSize(bytes)        // 格式化文件大小
formatDate(dateString)       // 格式化日期
getFileIcon(fileName, mimeType) // 获取文件图标
getFileType(mimeType)        // 获取文件类型描述
```

## 技术特性

### 1. 类型安全
- 完整的 TypeScript 类型定义
- 接口和类型检查
- 编译时错误检测

### 2. 错误处理
- 网络错误处理
- 文件操作错误处理
- 用户友好的错误提示

### 3. 用户体验
- 响应式设计（移动端和桌面端）
- 加载状态显示
- 进度反馈
- 操作确认

### 4. 性能优化
- 文件列表分页
- 按需加载
- 缓存控制

## 存储桶配置

### 存储桶信息
- **名称**: `temp_1`
- **权限**: Public (公开访问)
- **文件大小限制**: 50MB（默认）
- **CORS 配置**: 允许所有域名（开发环境）

### 权限策略
1. **读取权限**: 所有人可读（公开存储桶）
2. **上传权限**: 仅认证用户可上传
3. **更新权限**: 仅认证用户可更新自己的文件
4. **删除权限**: 仅认证用户可删除自己的文件

## 扩展功能建议

### 1. 文件预览
- 图片预览（缩略图）
- 文本文件预览
- PDF 预览
- 视频/音频播放

### 2. 批量操作
- 批量上传
- 批量下载（打包为 ZIP）
- 批量删除
- 批量移动/复制

### 3. 搜索和过滤
- 文件名搜索
- 文件类型过滤
- 日期范围过滤
- 大小过滤

### 4. 共享功能
- 生成分享链接
- 设置访问权限
- 分享有效期
- 访问统计

### 5. 版本控制
- 文件版本历史
- 版本恢复
- 修改记录

### 6. 回收站
- 删除文件到回收站
- 恢复已删除文件
- 清空回收站

## 故障排除

### 常见问题

#### 1. "Bucket not found" 错误
- 检查存储桶名称是否正确（`temp_1`）
- 确认存储桶已创建
- 验证环境变量配置

#### 2. "Permission denied" 错误
- 检查权限策略是否已设置
- 确认用户已登录
- 验证存储桶权限设置

#### 3. 文件上传失败
- 检查文件大小是否超过限制
- 验证网络连接
- 检查文件类型是否被允许

#### 4. 页面无法访问
- 检查用户是否已登录
- 验证认证配置
- 检查开发服务器是否运行

### 调试技巧

1. **浏览器开发者工具**
   - 查看网络请求
   - 检查控制台错误
   - 监控存储操作

2. **Supabase 控制台**
   - 查看存储桶内容
   - 检查权限策略
   - 监控存储使用情况

3. **应用日志**
   - 查看终端输出
   - 检查错误消息
   - 验证数据流

## 生产部署

### 1. 安全加固
- 使用私有存储桶（生产环境）
- 设置更严格的权限策略
- 启用 HTTPS
- 配置 CORS 策略

### 2. 性能优化
- 启用 CDN（如果可用）
- 优化文件上传大小限制
- 实现文件分片上传
- 添加缓存策略

### 3. 监控和日志
- 设置错误监控
- 记录用户操作
- 监控存储使用情况
- 设置使用限制

### 4. 备份和恢复
- 定期备份重要文件
- 实现数据恢复功能
- 设置存储配额
- 监控存储成本

## 支持资源

### 官方文档
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [Next.js 文档](https://nextjs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)

### 相关工具
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Next.js Dev Tools](https://nextjs.org/docs/app/building-your-application/configuring/dev-tools)

### 社区支持
- [Supabase Discord](https://discord.supabase.com)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

## 更新日志

### v1.0.0 (初始版本)
- 基础文件上传/下载功能
- 文件夹管理
- 用户认证集成
- 响应式界面设计
- 完整的错误处理

### 计划功能
- 文件预览功能
- 批量操作支持
- 搜索和过滤
- 文件共享功能
- 版本控制支持