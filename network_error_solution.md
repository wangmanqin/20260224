# "Failed to fetch" 错误解决方案

## 问题分析

"Failed to fetch" 错误通常是网络层面的问题，而不是 RLS 策略问题。这可能由以下原因引起：

1. **缺少服务角色密钥**
2. **CORS 配置问题**
3. **网络连接问题**
4. **认证令牌过期**
5. **Supabase 项目配置问题**

## 解决方案

### 方案 1: 添加服务角色密钥

在 `.env.local` 文件中添加服务角色密钥：

```
NEXT_PUBLIC_SUPABASE_URL=https://ptdutdjpifyjypmqnedc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_CyYwl1ZvWRxMi32Mb2G_Lg_Ai4cQrN4
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
```

### 方案 2: 检查 CORS 配置

在 Supabase Dashboard 中检查 CORS 配置：
1. 进入 Settings → API
2. 确保 CORS Origins 包含 `http://localhost:3000`

### 方案 3: 使用 Admin API

创建一个服务器端 API 端点来处理上传：

```typescript
// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderPath = formData.get('folderPath') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;

    const { data, error } = await supabase.storage
      .from('temp_1')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
```

### 方案 4: 修复客户端配置

更新客户端配置以更好地处理网络错误：

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      global: {
        headers: {
          'X-Client': 'NextJS-AppRouter'
        }
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    }
  );
}
```

### 方案 5: 使用 fetch 替代内置上传

创建一个自定义的上传方法：

```typescript
// utils/custom-upload.ts
export async function customUpload(file: File, folderPath: string = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderPath', folderPath);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return await response.json();
}
```

## 立即行动

1. **获取服务角色密钥**：
   - 进入 Supabase Dashboard
   - Settings → API
   - 复制 "Service role key"

2. **更新环境变量**：
   - 在 `.env.local` 中添加服务角色密钥

3. **重启开发服务器**：
   - 保存环境变量后重启服务器

4. **测试上传功能**：
   - 尝试上传文件验证修复

## 检查清单

- [ ] 服务角色密钥是否正确配置？
- [ ] CORS 配置是否正确？
- [ ] 网络连接是否正常？
- [ ] Supabase 项目是否正常运行？
- [ ] 认证令牌是否有效？

## 替代方案

如果上述方法都失败，考虑使用：

1. **Next.js API Routes** - 通过服务器端处理上传
2. **Presigned URLs** - 生成预签名 URL 进行上传
3. **代理服务器** - 创建中间层处理请求
4. **其他云存储** - 临时使用其他存储解决方案

## 重要提示

"Failed to fetch" 通常表示网络层面的问题，而不是权限问题。确保：

1. 网络连接稳定
2. Supabase 项目在线
3. 服务角色密钥正确配置
4. CORS 设置正确
5. 认证令牌有效