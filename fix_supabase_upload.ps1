Write-Host "===========================================" -ForegroundColor Green
Write-Host "Supabase 上传问题快速修复脚本 (Windows)" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

Write-Host ""
Write-Host "1. 检查环境配置..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✓ .env.local 文件存在" -ForegroundColor Green
} else {
    Write-Host "✗ .env.local 文件不存在，请创建该文件并添加 Supabase 配置" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. 检查 Node.js 和 npm..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 已安装 ($nodeVersion)" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js 未安装" -ForegroundColor Red
    exit 1
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "✓ npm 已安装 ($npmVersion)" -ForegroundColor Green
} else {
    Write-Host "✗ npm 未安装" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. 检查 TypeScript 配置..." -ForegroundColor Yellow
try {
    npx tsc --noEmit 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ TypeScript 检查通过" -ForegroundColor Green
    } else {
        Write-Host "✗ TypeScript 检查失败，请修复错误后再继续" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ TypeScript 检查失败，请修复错误后再继续" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. 重要提醒：" -ForegroundColor Yellow
Write-Host "   你需要在 Supabase Dashboard 的 SQL 编辑器中运行以下命令：" -ForegroundColor White
Write-Host ""
Write-Host "   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;" -ForegroundColor Cyan
Write-Host ""
Write-Host "   这是解决 RLS 策略错误的关键步骤！" -ForegroundColor Yellow
Write-Host ""

Write-Host "5. 服务角色密钥配置（推荐）：" -ForegroundColor Yellow
Write-Host "   在 .env.local 文件中添加：" -ForegroundColor White
Write-Host "   SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥" -ForegroundColor Cyan
Write-Host ""

Write-Host "6. 完成以上步骤后：" -ForegroundColor Yellow
Write-Host "   - 重启开发服务器" -ForegroundColor White
Write-Host "   - 访问 http://localhost:3000/storage" -ForegroundColor White
Write-Host "   - 测试上传功能" -ForegroundColor White
Write-Host ""

Write-Host "===========================================" -ForegroundColor Green
Write-Host "修复脚本执行完成" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green