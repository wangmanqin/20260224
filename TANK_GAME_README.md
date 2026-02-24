# 坦克大战游戏

使用 Supabase 实时功能构建的多人在线坦克大战游戏。

## 功能特性

- 实时多人游戏体验
- 基于 Supabase PostgreSQL 数据库的实时同步
- 碰撞检测和物理引擎
- 生命值和伤害系统
- 实时事件广播

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Supabase (数据库和实时功能)
- React Hooks
- HTML5 Canvas

## 数据库结构

游戏使用以下数据库表：

- `game_rooms`: 游戏房间管理
- `game_players`: 玩家状态管理
- `game_bullets`: 子弹轨迹追踪
- `game_events`: 游戏事件日志
- `game_states`: 游戏状态快照
- `game_stats`: 游戏统计数据

## 实时功能

游戏利用 Supabase 的实时功能实现实时同步：

- 玩家移动同步
- 子弹发射同步
- 碰撞事件广播
- 游戏状态更新

## 游戏操作

- 方向键：移动坦克
- 空格键：发射子弹

## 架构说明

- `/app/game/page.tsx`: 游戏入口页面
- `/app/game/TankGame.tsx`: 主游戏组件
- `/hooks/useGameRealtime.ts`: 实时数据处理 Hook
- `/utils/game/logicProcessor.ts`: 游戏逻辑处理器
- `/game_db_schema.sql`: 数据库模式定义

## 部署说明

1. 确保 Supabase 项目已配置
2. 运行 `game_db_schema.sql` 创建所需表
3. 设置正确的 RLS 策略
4. 部署 Next.js 应用

## 扩展建议

- 添加地图和障碍物
- 实现不同类型的武器
- 添加音效和视觉效果
- 实现排名和成就系统
- 优化网络同步算法