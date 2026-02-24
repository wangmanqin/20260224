#!/bin/bash
# Supabase 上传修复脚本

echo "==========================================="
echo "Supabase 上传问题快速修复脚本"
echo "==========================================="

echo ""
echo "1. 检查环境配置..."
if [ -f .env.local ]; then
    echo "✓ .env.local 文件存在"
else
    echo "✗ .env.local 文件不存在，请创建该文件并添加 Supabase 配置"
    exit 1
fi

echo ""
echo "2. 检查 Node.js 和 npm..."
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    echo "✓ Node.js 和 npm 已安装"
    echo "Node.js 版本: $(node --version)"
    echo "npm 版本: $(npm --version)"
else
    echo "✗ Node.js 或 npm 未安装"
    exit 1
fi

echo ""
echo "3. 检查 TypeScript 配置..."
if npx tsc --noEmit; then
    echo "✓ TypeScript 检查通过"
else
    echo "✗ TypeScript 检查失败，请修复错误后再继续"
    exit 1
fi

echo ""
echo "4. 重要提醒："
echo "   你需要在 Supabase Dashboard 的 SQL 编辑器中运行以下命令："
echo ""
echo "   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;"
echo ""
echo "   这是解决 RLS 策略错误的关键步骤！"
echo ""

echo "5. 服务角色密钥配置（推荐）："
echo "   在 .env.local 文件中添加："
echo "   SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥"
echo ""

echo "6. 完成以上步骤后："
echo "   - 重启开发服务器"
echo "   - 访问 http://localhost:3000/storage"
echo "   - 测试上传功能"
echo ""

echo "==========================================="
echo "修复脚本执行完成"
echo "==========================================="