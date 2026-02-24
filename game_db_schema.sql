-- 坦克大战游戏数据库表结构

-- 1. 游戏房间表
CREATE TABLE game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 玩家表
CREATE TABLE game_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  player_number INTEGER NOT NULL, -- 玩家编号 (1, 2, etc.)
  tank_x NUMERIC DEFAULT 0,
  tank_y NUMERIC DEFAULT 0,
  tank_direction TEXT DEFAULT 'up' CHECK (tank_direction IN ('up', 'down', 'left', 'right')),
  health INTEGER DEFAULT 100,
  score INTEGER DEFAULT 0,
  is_alive BOOLEAN DEFAULT true,
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 游戏状态表（实时同步游戏状态）
CREATE TABLE game_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  state JSONB, -- 存储游戏状态 (玩家位置、子弹、障碍物等)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 游戏事件表（用于实时通信）
CREATE TABLE game_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'move', 'shoot', 'hit', 'destroy', etc.
  event_data JSONB, -- 事件相关数据
  player_id UUID REFERENCES game_players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 子弹表（用于跟踪子弹轨迹）
CREATE TABLE game_bullets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES game_players(id),
  pos_x NUMERIC NOT NULL,
  pos_y NUMERIC NOT NULL,
  direction TEXT NOT NULL,
  speed NUMERIC DEFAULT 5,
  damage INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 游戏统计表
CREATE TABLE game_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  winner_player_id UUID REFERENCES game_players(id),
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为实时功能创建索引
CREATE INDEX idx_game_players_room_id ON game_players(room_id);
CREATE INDEX idx_game_events_room_id ON game_events(room_id);
CREATE INDEX idx_game_bullets_room_id ON game_bullets(room_id);
CREATE INDEX idx_game_states_room_id ON game_states(room_id);

-- 为实时订阅创建 RLS 策略
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_bullets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- 为认证用户启用访问权限的策略
CREATE POLICY "Allow authenticated users to play games" ON game_rooms
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow players to access their game data" ON game_players
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR 
    room_id IN (SELECT id FROM game_rooms WHERE true)
  );

CREATE POLICY "Allow players to access game states" ON game_states
  FOR ALL TO authenticated
  USING (
    room_id IN (
      SELECT gp.room_id 
      FROM game_players gp 
      WHERE gp.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow players to access game events" ON game_events
  FOR ALL TO authenticated
  USING (
    room_id IN (
      SELECT gp.room_id 
      FROM game_players gp 
      WHERE gp.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow players to access bullets" ON game_bullets
  FOR ALL TO authenticated
  USING (
    room_id IN (
      SELECT gp.room_id 
      FROM game_players gp 
      WHERE gp.user_id = auth.uid()
    )
  );