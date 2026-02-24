'use client';

import { useState, useEffect, useRef } from 'react';

// 游戏常量
const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  TANK_SIZE: 40,
  TANK_SPEED: 5,
  BULLET_SIZE: 8,
  BULLET_SPEED: 10,
};

// 子弹类型
interface Bullet {
  id: number;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  color: string;
}

// 简单版本的坦克游戏
export default function SimpleTankGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('无');
  const [displayTank, setDisplayTank] = useState({ x: 50, y: 500, direction: 'up' as const, color: '#4A90E2' });
  const [bullets, setBullets] = useState<Bullet[]>([]);

  // 使用 ref 存储游戏状态，避免状态更新延迟
  const myTankRef = useRef({ x: 50, y: 500, direction: 'up' as const, color: '#4A90E2' });
  const enemyTankRef = useRef({ x: 710, y: 500, direction: 'up' as const, color: '#E74C3C' });
  const bulletsRef = useRef<Bullet[]>([]);
  let bulletIdCounter = useRef(0);

  // 键盘控制状态
  const keysPressed = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
  });

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

  // 绘制子弹
  const drawBullet = (ctx: CanvasRenderingContext2D, bullet: Bullet) => {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, GAME_CONFIG.BULLET_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  // 发射子弹
  const fireBullet = () => {
    const tank = myTankRef.current;
    let bulletX = tank.x + GAME_CONFIG.TANK_SIZE / 2;
    let bulletY = tank.y + GAME_CONFIG.TANK_SIZE / 2;
    
    // 根据坦克方向调整子弹起始位置
    switch (tank.direction) {
      case 'up':
        bulletY = tank.y;
        break;
      case 'down':
        bulletY = tank.y + GAME_CONFIG.TANK_SIZE;
        break;
      case 'left':
        bulletX = tank.x;
        break;
      case 'right':
        bulletX = tank.x + GAME_CONFIG.TANK_SIZE;
        break;
    }
    
    const newBullet: Bullet = {
      id: bulletIdCounter.current++,
      x: bulletX,
      y: bulletY,
      direction: tank.direction,
      color: '#FFD700' // 金色子弹
    };
    
    bulletsRef.current = [...bulletsRef.current, newBullet];
    setBullets(bulletsRef.current);
  };

  // 更新子弹位置
  const updateBullets = () => {
    const updatedBullets = bulletsRef.current.map(bullet => {
      let newX = bullet.x;
      let newY = bullet.y;
      
      switch (bullet.direction) {
        case 'up':
          newY -= GAME_CONFIG.BULLET_SPEED;
          break;
        case 'down':
          newY += GAME_CONFIG.BULLET_SPEED;
          break;
        case 'left':
          newX -= GAME_CONFIG.BULLET_SPEED;
          break;
        case 'right':
          newX += GAME_CONFIG.BULLET_SPEED;
          break;
      }
      
      return { ...bullet, x: newX, y: newY };
    });
    
    // 移除超出画布的子弹
    const filteredBullets = updatedBullets.filter(bullet => 
      bullet.x >= 0 && bullet.x <= GAME_CONFIG.CANVAS_WIDTH &&
      bullet.y >= 0 && bullet.y <= GAME_CONFIG.CANVAS_HEIGHT
    );
    
    bulletsRef.current = filteredBullets;
    setBullets(filteredBullets);
  };

  // 更新坦克位置
  const updateTankPosition = () => {
    const tank = myTankRef.current;
    let newX = tank.x;
    let newY = tank.y;
    let direction = tank.direction;

    if (keysPressed.current.ArrowUp) {
      direction = 'up';
      newY = Math.max(0, tank.y - GAME_CONFIG.TANK_SPEED);
    }
    if (keysPressed.current.ArrowDown) {
      direction = 'down';
      newY = Math.min(GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.TANK_SIZE, tank.y + GAME_CONFIG.TANK_SPEED);
    }
    if (keysPressed.current.ArrowLeft) {
      direction = 'left';
      newX = Math.max(0, tank.x - GAME_CONFIG.TANK_SPEED);
    }
    if (keysPressed.current.ArrowRight) {
      direction = 'right';
      newX = Math.min(GAME_CONFIG.CANVAS_WIDTH / 2 - GAME_CONFIG.TANK_SIZE - 10, tank.x + GAME_CONFIG.TANK_SPEED);
    }

    // 更新 ref
    myTankRef.current = { ...tank, x: newX, y: newY, direction };
    
    // 更新显示状态
    setDisplayTank({ ...myTankRef.current });
  };

  // 游戏主循环
  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 更新坦克位置
    updateTankPosition();
    
    // 更新子弹位置
    updateBullets();

    // 清除画布
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制坦克
    drawTank(ctx, myTankRef.current);
    drawTank(ctx, enemyTankRef.current);
    
    // 绘制子弹
    bulletsRef.current.forEach(bullet => drawBullet(ctx, bullet));

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
      setLastKeyPressed(e.key);
      
      if (!gameStarted) return;

      // 阻止默认行为，防止页面滚动
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      if (e.key === ' ') {
        // 空格键发射子弹
        if (!keysPressed.current.Space) {
          keysPressed.current.Space = true;
          fireBullet();
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current[e.key as keyof typeof keysPressed.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        keysPressed.current.Space = false;
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current[e.key as keyof typeof keysPressed.current] = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
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
            <p>按空格键发射子弹</p>
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
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>子弹</span>
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
            <p>使用方向键移动，按空格键发射子弹</p>
            <p>最后按下的键: {lastKeyPressed}</p>
            <p>游戏状态: {gameStarted ? '进行中' : '未开始'}</p>
            <p>坦克位置: X={displayTank.x}, Y={displayTank.y}</p>
            <p>子弹数量: {bullets.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}