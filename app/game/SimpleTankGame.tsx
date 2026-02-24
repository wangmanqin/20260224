'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// 游戏常量
const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  TANK_SIZE: 40,
  TANK_SPEED: 3,
};

// 简单版本的坦克游戏
export default function SimpleTankGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const [supabase] = useState(() => createClient());
  const [gameStarted, setGameStarted] = useState(false);
  const [myTank, setMyTank] = useState({ x: 50, y: 500, direction: 'up', color: '#4A90E2' });
  const [enemyTank, setEnemyTank] = useState({ x: 710, y: 500, direction: 'up', color: '#E74C3C' });

  // 绘制坦克
  const drawTank = (ctx: CanvasRenderingContext2D, tank: any) => {
    ctx.fillStyle = tank.color;
    ctx.fillRect(tank.x, tank.y, GAME_CONFIG.TANK_SIZE, GAME_CONFIG.TANK_SIZE);
    
    // 绘制方向指示器
    ctx.fillStyle = '#000';
    let indicatorX = 0, indicatorY = 0;
    switch (tank.direction) {
      case 'up':
        indicatorX = tank.x + GAME_CONFIG.TANK_SIZE / 2 - 2;
        indicatorY = tank.y;
        break;
      case 'down':
        indicatorX = tank.x + GAME_CONFIG.TANK_SIZE / 2 - 2;
        indicatorY = tank.y + GAME_CONFIG.TANK_SIZE - 4;
        break;
      case 'left':
        indicatorX = tank.x;
        indicatorY = tank.y + GAME_CONFIG.TANK_SIZE / 2 - 2;
        break;
      case 'right':
        indicatorX = tank.x + GAME_CONFIG.TANK_SIZE - 4;
        indicatorY = tank.y + GAME_CONFIG.TANK_SIZE / 2 - 2;
        break;
    }
    ctx.fillRect(indicatorX, indicatorY, 4, 4);
  };

  // 游戏主循环
  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除画布
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制坦克
    drawTank(ctx, myTank);
    drawTank(ctx, enemyTank);

    // 绘制中间分割线
    ctx.strokeStyle = '#555';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;

      setMyTank(prev => {
        let newX = prev.x;
        let newY = prev.y;
        let direction = prev.direction;

        switch (e.key) {
          case 'ArrowUp':
            direction = 'up';
            newY = Math.max(0, prev.y - GAME_CONFIG.TANK_SPEED);
            break;
          case 'ArrowDown':
            direction = 'down';
            newY = Math.min(GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.TANK_SIZE, prev.y + GAME_CONFIG.TANK_SPEED);
            break;
          case 'ArrowLeft':
            direction = 'left';
            newX = Math.max(0, prev.x - GAME_CONFIG.TANK_SPEED);
            break;
          case 'ArrowRight':
            direction = 'right';
            newX = Math.min(GAME_CONFIG.CANVAS_WIDTH / 2 - GAME_CONFIG.TANK_SIZE - 10, prev.x + GAME_CONFIG.TANK_SPEED);
            break;
        }

        return { ...prev, x: newX, y: newY, direction };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted]);

  // 启动游戏循环
  useEffect(() => {
    if (gameStarted) {
      gameLoop();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted]);

  // 开始游戏
  const startGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">坦克大战</h1>
      
      {!gameStarted ? (
        <div className="flex flex-col items-center space-y-6">
          <p className="text-xl text-gray-400">点击下方按钮开始游戏</p>
          <button
            onClick={startGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded text-xl transition duration-200"
          >
            开始游戏
          </button>
          <div className="mt-8 text-gray-400 text-sm">
            <p>使用方向键控制坦克移动</p>
            <p>你是蓝色坦克，红色坦克是对手</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>你</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>对手</span>
            </div>
          </div>
          
          <div className="border-2 border-gray-700 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={GAME_CONFIG.CANVAS_WIDTH}
              height={GAME_CONFIG.CANVAS_HEIGHT}
              className="bg-gray-800"
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            <p>使用方向键移动</p>
          </div>
        </div>
      )}
    </div>
  );
}