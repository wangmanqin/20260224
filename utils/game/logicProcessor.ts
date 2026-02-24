// 游戏逻辑处理器
export class GameLogicProcessor {
  // 检测两个矩形是否碰撞（用于坦克之间）
  static checkRectCollision(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    );
  }

  // 检测圆形和矩形是否碰撞（用于子弹和坦克）
  static checkCircleRectCollision(circleX: number, circleY: number, radius: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean {
    // 找到圆心到矩形最近的点
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));

    // 计算圆心到最近点的距离
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;

    // 如果距离小于半径，则发生碰撞
    return (distanceX * distanceX + distanceY * distanceY) < (radius * radius);
  }

  // 检测子弹与坦克的碰撞
  static checkBulletTankCollision(bullet: any, tank: any, bulletSize: number, tankSize: number): boolean {
    return this.checkCircleRectCollision(
      parseFloat(bullet.pos_x),
      parseFloat(bullet.pos_y),
      bulletSize / 2,
      parseFloat(tank.tank_x),
      parseFloat(tank.tank_y),
      tankSize,
      tankSize
    );
  }

  // 检测子弹之间的碰撞
  static checkBulletBulletCollision(bullet1: any, bullet2: any, bulletSize: number): boolean {
    const dx = parseFloat(bullet1.pos_x) - parseFloat(bullet2.pos_x);
    const dy = parseFloat(bullet1.pos_y) - parseFloat(bullet2.pos_y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < bulletSize;
  }

  // 更新子弹位置
  static updateBulletPosition(bullet: any, deltaTime: number = 16): any {
    let newX = parseFloat(bullet.pos_x);
    let newY = parseFloat(bullet.pos_y);
    const speed = parseFloat(bullet.speed) || 5;

    // 根据方向更新位置
    switch (bullet.direction) {
      case 'up':
        newY -= speed;
        break;
      case 'down':
        newY += speed;
        break;
      case 'left':
        newX -= speed;
        break;
      case 'right':
        newX += speed;
        break;
    }

    return {
      ...bullet,
      pos_x: newX,
      pos_y: newY,
    };
  }

  // 检查子弹是否超出边界
  static isBulletOutOfBounds(bullet: any, canvasWidth: number, canvasHeight: number): boolean {
    const x = parseFloat(bullet.pos_x);
    const y = parseFloat(bullet.pos_y);
    const margin = 10; // 边界外的容错范围
    
    return (
      x < -margin || 
      x > canvasWidth + margin || 
      y < -margin || 
      y > canvasHeight + margin
    );
  }

  // 处理碰撞检测和游戏事件
  static processCollisions(gameState: any, canvasWidth: number, canvasHeight: number, tankSize: number, bulletSize: number) {
    const updatedGameState = { ...gameState };
    const bulletsToRemove: string[] = [];
    const tanksHit: { tankId: string, bulletId: string }[] = [];

    // 更新子弹位置
    updatedGameState.bullets = updatedGameState.bullets.map((bullet: any) => 
      this.updateBulletPosition(bullet)
    ).filter((bullet: any) => !this.isBulletOutOfBounds(bullet, canvasWidth, canvasHeight));

    // 检测子弹与坦克的碰撞
    for (const bullet of updatedGameState.bullets) {
      for (const tank of updatedGameState.players) {
        if (tank.is_alive && this.checkBulletTankCollision(bullet, tank, bulletSize, tankSize)) {
          tanksHit.push({ tankId: tank.id, bulletId: bullet.id });
          bulletsToRemove.push(bullet.id); // 子弹击中目标后消失
        }
      }
    }

    // 处理碰撞结果
    for (const hit of tanksHit) {
      // 更新被击中坦克的状态
      const tankIndex = updatedGameState.players.findIndex((p: any) => p.id === hit.tankId);
      if (tankIndex !== -1) {
        const currentHealth = parseInt(updatedGameState.players[tankIndex].health) || 100;
        const newHealth = Math.max(0, currentHealth - 25); // 每次击中减少25血
        
        updatedGameState.players[tankIndex] = {
          ...updatedGameState.players[tankIndex],
          health: newHealth,
          is_alive: newHealth > 0
        };
      }
    }

    // 移除已碰撞的子弹
    updatedGameState.bullets = updatedGameState.bullets.filter(
      (bullet: any) => !bulletsToRemove.includes(bullet.id)
    );

    return updatedGameState;
  }
}