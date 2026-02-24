'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useGameRealtime } from '@/hooks/useGameRealtime';
import { GameLogicProcessor } from '@/utils/game/logicProcessor';

// 游戏常量
const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  TANK_SIZE: 40,
  BULLET_SIZE: 6,
  TANK_SPEED: 3,
  BULLET_SPEED: 7,
};

// 游戏组件
export default function TankGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastUpdateTime = useRef<number>(0);
  
  const [supabase] = useState(() => createClient());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [myPlayerNumber, setMyPlayerNumber] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  
  // 使用实时 Hook
  const { gameState, refreshGameState, sendGameEvent, updatePlayer, createBullet, removeBullet } = useGameRealtime(roomId);

  // 创建新游戏房间
  const createRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('请先登录');
        router.push('/login');
        return;
      }

      // 创建游戏房间
      const { data: newRoom, error: roomError } = await supabase
        .from('game_rooms')
        .insert([{ name: `Room-${Date.now()}`, max_players: 2, status: 'waiting' }])
        .select()
        .single();

      if (roomError) throw roomError;

      // 根据玩家编号设置初始位置
      const initialPositions = [
        { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 100 },  // 玩家1在底部
        { x: GAME_CONFIG.CANVAS_WIDTH - 90, y: GAME_CONFIG.CANVAS_HEIGHT - 100 }  // 玩家2在右下角
      ];

      // 创建玩家
      const { data: newPlayer, error: playerError } = await supabase
        .from('game_players')
        .insert([{
          room_id: newRoom.id,
          user_id: user.id,
          player_number: 1, // 第一个玩家
          tank_x: initialPositions[0].x,
          tank_y: initialPositions[0].y,
          tank_direction: 'up',
          health: 100,
          is_alive: true,
        }])
        .select()
        .single();

      if (playerError) throw playerError;

      setRoomId(newRoom.id);
      setPlayerId(newPlayer.id);
      setMyPlayerNumber(1);
      setGameStatus('waiting');
      
      // 发送玩家加入事件
      sendGameEvent('player_joined', { playerName: user.email }, newPlayer.id);
    } catch (error: any) {
      console.error('创建房间失败:', error);
      alert('创建房间失败: ' + error.message);
    }
  };

  // 加入游戏房间
  const joinRoom = async (roomId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('请先登录');
        router.push('/login');
        return;
      }

      // 检查房间是否已满
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !room) {
        alert('房间不存在');
        return;
      }

      // 检查是否有空位
      const { data: existingPlayers, error: playersError } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) throw playersError;

      if (existingPlayers.length >= room.max_players) {
        alert('房间已满');
        return;
      }

      // 根据玩家编号设置初始位置
      const initialPositions = [
        { x: 50, y: GAME_CONFIG.CANVAS_HEIGHT - 100 },  // 玩家1在底部
        { x: GAME_CONFIG.CANVAS_WIDTH - 90, y: GAME_CONFIG.CANVAS_HEIGHT - 100 }  // 玩家2在右下角
      ];

      // 创建玩家
      const playerNumber = existingPlayers.length + 1;
      const { data: newPlayer, error: playerError } = await supabase
        .from('game_players')
        .insert([{
          room_id: roomId,
          user_id: user.id,
          player_number: playerNumber,
          tank_x: initialPositions[playerNumber - 1]?.x || 50,
          tank_y: initialPositions[playerNumber - 1]?.y || GAME_CONFIG.CANVAS_HEIGHT - 100,
          tank_direction: 'up',
          health: 100,
          is_alive: true,
        }])
        .select()
        .single();

      if (playerError) throw playerError;

      setRoomId(roomId);
      setPlayerId(newPlayer.id);
      setMyPlayerNumber(playerNumber);
      setGameStatus('playing'); // 开始游戏
      
      // 发送玩家加入事件
      sendGameEvent('player_joined', { playerName: user.email }, newPlayer.id);
      
      // 如果这是第二个玩家，开始游戏
      if (existingPlayers.length === 1) {
        await startGame(roomId);
        setGameStatus('playing');
      }
    } catch (error: any) {
      console.error('加入房间失败:', error);
      alert('加入房间失败: ' + error.message);
    }
  };

  // 开始游戏
  const startGame = async (roomId: string) => {
    try {
      // 更新房间状态
      const { error } = await supabase
        .from('game_rooms')
        .update({ status: 'playing' })
        .eq('id', roomId);

      if (error) throw error;
      
      setGameStatus('playing');
      
      // 发送游戏开始事件
      sendGameEvent('game_started', {}, undefined);
    } catch (error) {
      console.error('开始游戏失败:', error);
    }
  };

  // 发送移动事件
  const sendMoveEvent = async (direction: string) => {
    if (!playerId || !roomId) return;

    try {
      // 获取当前玩家
      const player = gameState.players.find((p: any) => p.id === playerId);
      if (!player) return;

      let newX = typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x;
      let newY = typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y;

      switch (direction) {
        case 'ArrowUp':
          newY = Math.max(0, (typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) - GAME_CONFIG.TANK_SPEED);
          break;
        case 'ArrowDown':
          newY = Math.min(GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.TANK_SIZE, (typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) + GAME_CONFIG.TANK_SPEED);
          break;
        case 'ArrowLeft':
          newX = Math.max(0, (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) - GAME_CONFIG.TANK_SPEED);
          break;
        case 'ArrowRight':
          newX = Math.min(GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.TANK_SIZE, (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) + GAME_CONFIG.TANK_SPEED);
          break;
      }

      // 更新数据库
      await updatePlayer(playerId, { 
        tank_x: newX, 
        tank_y: newY, 
        tank_direction: getDirectionFromKey(direction) 
      });

      // 发送移动事件
      sendGameEvent('tank_moved', { 
        direction, 
        position: { x: newX, y: newY } 
      }, playerId);
    } catch (error) {
      console.error('发送移动事件失败:', error);
    }
  };

  // 根据按键确定方向
  const getDirectionFromKey = (key: string): string => {
    switch (key) {
      case 'ArrowUp': return 'up';
      case 'ArrowDown': return 'down';
      case 'ArrowLeft': return 'left';
      case 'ArrowRight': return 'right';
      default: return 'up';
    }
  };

  // 发射子弹
  const shootBullet = async () => {
    if (!playerId || !roomId) return;

    try {
      const player = gameState.players.find((p: any) => p.id === playerId);
      if (!player) return;

      // 计算子弹初始位置和方向
      let bulletX = (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) + GAME_CONFIG.TANK_SIZE / 2;
      let bulletY = (typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) + GAME_CONFIG.TANK_SIZE / 2;
      let direction = player.tank_direction;

      // 根据坦克方向调整子弹发射点
      switch (direction) {
        case 'up':
          bulletY -= GAME_CONFIG.TANK_SIZE / 2;
          break;
        case 'down':
          bulletY += GAME_CONFIG.TANK_SIZE / 2;
          break;
        case 'left':
          bulletX -= GAME_CONFIG.TANK_SIZE / 2;
          break;
        case 'right':
          bulletX += GAME_CONFIG.TANK_SIZE / 2;
          break;
      }

      // 创建子弹
      await createBullet(playerId, {
        pos_x: bulletX,
        pos_y: bulletY,
        direction: direction,
        speed: GAME_CONFIG.BULLET_SPEED,
      });

      // 发送子弹发射事件
      sendGameEvent('bullet_fired', { 
        position: { x: bulletX, y: bulletY },
        direction 
      }, playerId);
    } catch (error) {
      console.error('发射子弹失败:', error);
    }
  };

  // 游戏主循环
  const gameLoop = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 计算时间差，用于平滑动画
    const deltaTime = timestamp - (lastUpdateTime.current || timestamp);
    lastUpdateTime.current = timestamp;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 如果游戏正在进行，处理游戏逻辑
    let processedGameState = gameState;
    if (gameStatus === 'playing') {
      // 处理碰撞和其他游戏逻辑
      processedGameState = GameLogicProcessor.processCollisions(
        gameState, 
        GAME_CONFIG.CANVAS_WIDTH, 
        GAME_CONFIG.CANVAS_HEIGHT, 
        GAME_CONFIG.TANK_SIZE, 
        GAME_CONFIG.BULLET_SIZE
      );
      
      // 检查游戏是否结束（所有敌方坦克被摧毁）
      const alivePlayers = processedGameState.players.filter((p: any) => p.is_alive);
      if (alivePlayers.length <= 1) {
        setGameStatus('finished');
        sendGameEvent('game_over', { winner: alivePlayers[0]?.id }, undefined);
      }
    }

    // 绘制玩家坦克
    processedGameState.players.forEach((player: any) => {
      if (player.is_alive) {
        // 设置颜色根据玩家编号
        if (player.player_number === 1) {
          ctx.fillStyle = '#4A90E2'; // 蓝色
        } else {
          ctx.fillStyle = '#E74C3C'; // 红色
        }

        // 绘制坦克主体
        ctx.fillRect(
          (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) || 0, 
          (typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) || 0, 
          GAME_CONFIG.TANK_SIZE, 
          GAME_CONFIG.TANK_SIZE
        );

        // 绘制生命值条
        const healthPercent = ((typeof player.health === 'string' ? parseInt(player.health) : player.health) || 100) / 100;
        ctx.fillStyle = '#000';
        ctx.fillRect(
          (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) || 0, 
          ((typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) || 0) - 10, 
          GAME_CONFIG.TANK_SIZE, 
          5
        );
        ctx.fillStyle = healthPercent > 0.5 ? '#2ECC71' : healthPercent > 0.25 ? '#F39C12' : '#E74C3C';
        ctx.fillRect(
          (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) || 0, 
          ((typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) || 0) - 10, 
          GAME_CONFIG.TANK_SIZE * healthPercent, 
          5
        );

        // 绘制坦克方向指示器
        ctx.fillStyle = '#000';
        let indicatorX = 0, indicatorY = 0;

        switch (player.tank_direction) {
          case 'up':
            indicatorX = (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) + GAME_CONFIG.TANK_SIZE / 2 - 2;
            indicatorY = (typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y);
            break;
          case 'down':
            indicatorX = (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) + GAME_CONFIG.TANK_SIZE / 2 - 2;
            indicatorY = (typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) + GAME_CONFIG.TANK_SIZE - 4;
            break;
          case 'left':
            indicatorX = (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x);
            indicatorY = (typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) + GAME_CONFIG.TANK_SIZE / 2 - 2;
            break;
          case 'right':
            indicatorX = (typeof player.tank_x === 'string' ? parseFloat(player.tank_x) : player.tank_x) + GAME_CONFIG.TANK_SIZE - 4;
            indicatorY = (typeof player.tank_y === 'string' ? parseFloat(player.tank_y) : player.tank_y) + GAME_CONFIG.TANK_SIZE / 2 - 2;
            break;
        }

        ctx.fillRect(indicatorX, indicatorY, 4, 4);
      } else {
        // 绘制被摧毁的坦克
        ctx.fillStyle = '#7F8C8D';
        ctx.fillRect(
          parseFloat(player.tank_x) || 0, 
          parseFloat(player.tank_y) || 0, 
          GAME_CONFIG.TANK_SIZE, 
          GAME_CONFIG.TANK_SIZE
        );
      }
    });

    // 绘制子弹
    processedGameState.bullets.forEach((bullet: any) => {
      ctx.fillStyle = '#F1C40F'; // 黄色
      ctx.beginPath();
      ctx.arc(
        (typeof bullet.pos_x === 'string' ? parseFloat(bullet.pos_x) : bullet.pos_x) || 0,
        (typeof bullet.pos_y === 'string' ? parseFloat(bullet.pos_y) : bullet.pos_y) || 0,
        GAME_CONFIG.BULLET_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // 继续游戏循环
    animationRef.current = requestAnimationFrame(gameLoop);
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current.add(e.key);
        sendMoveEvent(e.key);
      } else if (e.key === ' ') {
        e.preventDefault(); // 阻止空格键滚动页面
        shootBullet();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, roomId, playerId]);

  // 开始游戏循环
  useEffect(() => {
    if (roomId) {
      lastUpdateTime.current = 0;
      gameLoop(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [roomId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">坦克大战</h1>
      
      {!roomId ? (
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={createRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition duration-200"
          >
            创建房间
          </button>
          
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="text"
              placeholder="输入房间ID"
              className="px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  joinRoom(e.currentTarget.value);
                }
              }}
            />
            <button
              onClick={(e) => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input && input.value) {
                  joinRoom(input.value);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              加入房间
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full max-w-4xl">
          <div className="mb-4 flex items-center space-x-4">
            <span>房间ID: {roomId}</span>
            <span>玩家编号: {myPlayerNumber}</span>
            <span>玩家数量: {gameState.players.length}</span>
            <span>状态: {gameStatus === 'waiting' ? '等待中' : gameStatus === 'playing' ? '游戏中' : '游戏结束'}</span>
          </div>
          
          <div className="relative border-2 border-gray-700 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={GAME_CONFIG.CANVAS_WIDTH}
              height={GAME_CONFIG.CANVAS_HEIGHT}
              className="bg-gray-800"
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            <p>使用方向键移动，空格键射击</p>
          </div>
        </div>
      )}
    </div>
  );
}