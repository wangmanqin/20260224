'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Player {
  id: string;
  room_id: string;
  user_id: string;
  player_number: number;
  tank_x: number;
  tank_y: number;
  tank_direction: string;
  health: number;
  score: number;
  is_alive: boolean;
  connected: boolean;
  created_at: string;
  updated_at: string;
}

interface Bullet {
  id: string;
  room_id: string;
  player_id: string;
  pos_x: number;
  pos_y: number;
  direction: string;
  speed: number;
  damage: number;
  created_at: string;
}

interface GameState {
  players: Player[];
  bullets: Bullet[];
}

export const useGameRealtime = (roomId: string | null) => {
  const supabase = createClient();
  const [gameState, setGameState] = useState<GameState>({ players: [], bullets: [] });
  const channelRef = useRef<any>(null);

  // 订阅游戏状态变化
  useEffect(() => {
    if (!roomId) return;

    // 创建频道并订阅变化
    const channel = supabase.channel(`game-state-${roomId}`);
    
    // 订阅玩家变化
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log('Player change:', payload);
        refreshGameState();
      }
    );

    // 订阅子弹变化
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_bullets',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log('Bullet change:', payload);
        refreshGameState();
      }
    );

    // 订阅游戏事件
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log('Game event:', payload);
        handleGameEvent(payload.new);
      }
    );

    // 订阅游戏状态变化
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_states',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        console.log('Game state change:', payload);
        refreshGameState();
      }
    );

    // 订阅频道
    supabase.removeChannel(channel);
    channel.subscribe();

    // 保存频道引用
    channelRef.current = channel;

    // 初始化游戏状态
    refreshGameState();

    // 清理函数
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId]);

  // 刷新游戏状态
  const refreshGameState = async () => {
    if (!roomId) return;

    try {
      // 获取所有玩家
      const { data: players, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) {
        console.error('获取玩家数据失败:', playersError);
        return;
      }

      // 获取所有子弹
      const { data: bullets, error: bulletsError } = await supabase
        .from('game_bullets')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false }); // 最新的在前

      if (bulletsError) {
        console.error('获取子弹数据失败:', bulletsError);
        return;
      }

      setGameState({
        players: players || [],
        bullets: bullets || [],
      });
    } catch (error) {
      console.error('刷新游戏状态失败:', error);
    }
  };

  // 处理游戏事件
  const handleGameEvent = (event: any) => {
    // 根据事件类型执行相应操作
    switch (event.event_type) {
      case 'player_joined':
        console.log(`玩家 ${event.player_id} 加入了游戏`);
        break;
      case 'player_left':
        console.log(`玩家 ${event.player_id} 离开了游戏`);
        break;
      case 'tank_moved':
        console.log(`玩家 ${event.player_id} 移动了坦克`);
        break;
      case 'bullet_fired':
        console.log(`玩家 ${event.player_id} 发射了子弹`);
        break;
      case 'tank_hit':
        console.log(`玩家 ${event.player_id} 的坦克被击中`);
        break;
      case 'game_over':
        console.log(`游戏结束，获胜者: ${event.winner_player_id}`);
        break;
      default:
        console.log('未知游戏事件:', event);
    }
  };

  // 发送游戏事件
  const sendGameEvent = async (eventType: string, eventData: any, playerId?: string) => {
    if (!roomId) return;

    try {
      const { error } = await supabase
        .from('game_events')
        .insert([{
          room_id: roomId,
          event_type: eventType,
          event_data: eventData,
          player_id: playerId,
        }]);

      if (error) {
        console.error('发送游戏事件失败:', error);
      }
    } catch (error) {
      console.error('发送游戏事件失败:', error);
    }
  };

  // 更新玩家状态
  const updatePlayer = async (playerId: string, updates: Partial<Player>) => {
    try {
      const { error } = await supabase
        .from('game_players')
        .update(updates)
        .eq('id', playerId);

      if (error) {
        console.error('更新玩家状态失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('更新玩家状态失败:', error);
    }
  };

  // 创建子弹
  const createBullet = async (playerId: string, bulletData: Partial<Bullet>) => {
    if (!roomId) return;

    try {
      const { error } = await supabase
        .from('game_bullets')
        .insert([{
          room_id: roomId,
          player_id: playerId,
          ...bulletData,
        }]);

      if (error) {
        console.error('创建子弹失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('创建子弹失败:', error);
    }
  };

  // 删除子弹
  const removeBullet = async (bulletId: string) => {
    try {
      const { error } = await supabase
        .from('game_bullets')
        .delete()
        .eq('id', bulletId);

      if (error) {
        console.error('删除子弹失败:', error);
        throw error;
      }
    } catch (error) {
      console.error('删除子弹失败:', error);
    }
  };

  return {
    gameState,
    refreshGameState,
    sendGameEvent,
    updatePlayer,
    createBullet,
    removeBullet,
  };
};