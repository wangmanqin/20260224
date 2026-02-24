# Supabase 服务角色密钥配置指南

## 问题解决

我们已经实现了多种解决方案来解决 "Failed to fetch" 和 "new row violates row-level security policy" 错误：

1. **服务器端 API 上传** - 通过 `/api/storage` 路由处理文件上传
2. **自动错误处理** - 客户端上传失败时自动切换到服务器端
3. **增强的错误信息** - 提供详细的解决方案提示

## 如何配置服务角色密钥

### 1. 获取服务角色密钥
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制 **Service role key**

### 2. 配置环境变量
在 `.env.local` 文件中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://ptdutdjpifyjypmqnedc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_CyYwl1ZvWRxMi32Mb2G_Lg_Ai4cQrN4
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
```

### 3. 重启开发服务器
保存环境变量后，重启开发服务器使配置生效。

## 新功能

### 服务器端 API
- 路径: `/api/storage`
- 支持上传和获取文件列表
- 绕过客户端网络问题
- 使用服务角色密钥直接访问

### 自动故障转移
- 首先尝试客户端上传
- 如果遇到网络错误，自动切换到服务器端 API
- 提供更好的用户体验

## 使用方法

1. **配置服务角色密钥**（推荐）
2. **重启服务器**
3. **访问** `http://localhost:3000/storage`
4. **上传文件测试**

## 无需服务角色密钥的选项

如果你不想使用服务角色密钥，也可以：

1. **运行 RLS 修复脚本**（在 `direct_rls_fix.sql` 中）
2. **继续使用客户端上传**
3. **接受可能的网络限制**

## 故障排除

### 如果仍有问题
1. 检查网络连接
2. 验证 Supabase 项目状态
3. 确认存储桶存在且为公开
4. 检查 CORS 配置

### 验证修复
- 上传小文件测试
- 检查文件是否出现在列表中
- 尝试下载刚上传的文件

## 文件变更

- `app/api/storage/route.ts` - 服务器端上传 API
- `utils/supabase/storage.ts` - 更新的存储管理器
- `app/storage/StorageApp.tsx` - 更新的存储应用组件
- `network_error_solution.md` - 问题分析文档

现在你可以使用服务角色密钥配置来获得更好的上传性能和可靠性。