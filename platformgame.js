// ============================================
// ABSTRACTION: Abstract Base Entity Class
// All game objects inherit from this
// ============================================
class Entity {
    constructor(x, y, width, height, color) {
        // Prevent direct instantiation of abstract class
        if (new.target === Entity) {
            throw new Error("Cannot instantiate abstract Entity class directly");
        }
        
        // ENCAPSULATION: Core properties all entities share
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.active = true;
    }

    // Abstract method - MUST be implemented by child classes
    update() {
        throw new Error("update() must be implemented by child class");
    }

    // Abstract method - MUST be implemented by child classes
    render(ctx) {
        throw new Error("render() must be implemented by child class");
    }

    // ABSTRACTION: Simplified collision detection
    collidesWith(other) {
        return (
            this.active &&
            other.active &&
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }
}

// ============================================
// INHERITANCE: Player extends Entity
// POLYMORPHISM: Implements its own update() and render()
// ============================================
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, '#4CAF50');
        
        // ENCAPSULATION: Player-specific properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 6;  // Increased from 5
        this.jumpPower = 15;  // Increased from 12 for higher jumps!
        this.gravity = 0.6;  // Slightly increased for better feel
        this.isOnGround = false;
        this.health = 5;  // Increased from 3 for longer game
        this.maxHealth = 5;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.doubleJumpAvailable = false;  // NEW: Double jump feature
        this.hasDoubleJump = false;
    }

    // POLYMORPHISM: Player's unique update implementation
    update(platforms, enemies) {
        // Apply gravity
        this.velocityY += this.gravity;
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Store previous ground state
        const wasOnGround = this.isOnGround;
        this.isOnGround = false;
        
        // Check platform collisions
        this.checkPlatformCollisions(platforms);
        
        // Reset double jump when landing
        if (this.isOnGround && !wasOnGround) {
            this.doubleJumpAvailable = true;
        }
        
        // Check enemy collisions
        this.checkEnemyCollisions(enemies);
        
        // Keep player in bounds
        this.constrainToBounds();
        
        // Update invincibility
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    checkPlatformCollisions(platforms) {
        platforms.forEach(platform => {
            if (this.collidesWith(platform)) {
                // Landing on top of platform
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y + 5) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isOnGround = true;
                }
                // Hitting bottom of platform
                else if (this.velocityY < 0 && this.y - this.velocityY >= platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // Hitting from left
                else if (this.velocityX > 0) {
                    this.x = platform.x - this.width;
                    this.velocityX = 0;
                }
                // Hitting from right
                else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width;
                    this.velocityX = 0;
                }
            }
        });
    }

    checkEnemyCollisions(enemies) {
        if (this.invincible) return;
        
        enemies.forEach(enemy => {
            if (this.collidesWith(enemy)) {
                // Jump on enemy's head to defeat it
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= enemy.y + 10) {
                    enemy.defeat();
                    this.velocityY = -10; // Bounce higher!
                } else {
                    // Take damage
                    this.takeDamage();
                }
            }
        });
    }

    takeDamage() {
        if (!this.invincible) {
            this.health--;
            this.invincible = true;
            this.invincibleTimer = 90; // 1.5 seconds at 60 FPS
            
            if (this.health <= 0) {
                this.active = false;
            }
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    constrainToBounds() {
        // Left boundary
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        // Right boundary - EXTENDED for longer level
        if (this.x + this.width > 2400) {  // Extended from 800
            this.x = 2400 - this.width;
            this.velocityX = 0;
        }
        // Bottom boundary (death)
        if (this.y > 600) {
            this.health = 0;
            this.active = false;
        }
    }

    moveLeft() {
        this.velocityX = -this.speed;
    }

    moveRight() {
        this.velocityX = this.speed;
    }

    stop() {
        this.velocityX = 0;
    }

    jump() {
        // Regular jump from ground
        if (this.isOnGround) {
            this.velocityY = -this.jumpPower;
            this.isOnGround = false;
        }
        // Double jump in air (if power-up collected)
        else if (this.hasDoubleJump && this.doubleJumpAvailable) {
            this.velocityY = -this.jumpPower;
            this.doubleJumpAvailable = false;
        }
    }

    // POLYMORPHISM: Player's unique render implementation
    render(ctx, cameraX) {
        // Adjust for camera
        const screenX = this.x - cameraX;
        
        // Flashing effect when invincible
        if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
            return;
        }
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 10, this.y + 10, 8, 8);
        ctx.fillRect(screenX + 22, this.y + 10, 8, 8);
        
        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + 20, this.y + 20, 10, 0, Math.PI);
        ctx.stroke();
        
        // Double jump indicator
        if (this.hasDoubleJump && this.doubleJumpAvailable) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(screenX + 20, this.y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ============================================
// INHERITANCE: Enemy extends Entity
// POLYMORPHISM: Implements AI behavior in update()
// ============================================
class Enemy extends Entity {
    constructor(x, y, patrolStart, patrolEnd) {
        super(x, y, 35, 35, '#F44336');
        
        // ENCAPSULATION: Enemy-specific AI properties
        this.velocityX = 2;
        this.velocityY = 0;
        this.gravity = 0.6;
        this.patrolStart = patrolStart;
        this.patrolEnd = patrolEnd;
        this.direction = 1;
        this.defeated = false;
        this.defeatTimer = 0;
    }

    // POLYMORPHISM: Enemy's unique AI update implementation
    update(platforms) {
        if (this.defeated) {
            this.defeatTimer++;
            if (this.defeatTimer > 30) {
                this.active = false;
            }
            return;
        }
        
        // Apply gravity
        this.velocityY += this.gravity;
        
        // AI Patrol behavior
        this.x += this.velocityX * this.direction;
        this.y += this.velocityY;
        
        // Check platform collisions
        this.checkPlatformCollisions(platforms);
        
        // Patrol logic
        if (this.x <= this.patrolStart) {
            this.x = this.patrolStart;
            this.direction = 1;
        } else if (this.x + this.width >= this.patrolEnd) {
            this.x = this.patrolEnd - this.width;
            this.direction = -1;
        }
    }

    checkPlatformCollisions(platforms) {
        platforms.forEach(platform => {
            if (this.collidesWith(platform)) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y + 5) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            }
        });
    }

    defeat() {
        this.defeated = true;
        this.color = '#FFCDD2';
    }

    // POLYMORPHISM: Enemy's unique render implementation
    render(ctx, cameraX) {
        if (!this.active) return;
        
        const screenX = this.x - cameraX;
        
        if (this.defeated) {
            ctx.save();
            ctx.translate(screenX + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.defeatTimer * 0.2);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        } else {
            // Body
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX, this.y, this.width, this.height);
            
            // Angry eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(screenX + 8, this.y + 10, 6, 6);
            ctx.fillRect(screenX + 21, this.y + 10, 6, 6);
            
            // Angry eyebrows
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX + 8, this.y + 8);
            ctx.lineTo(screenX + 14, this.y + 10);
            ctx.moveTo(screenX + 27, this.y + 8);
            ctx.lineTo(screenX + 21, this.y + 10);
            ctx.stroke();
            
            // Frown
            ctx.beginPath();
            ctx.arc(screenX + 17.5, this.y + 28, 8, Math.PI, 0);
            ctx.stroke();
        }
    }
}

// ============================================
// INHERITANCE: Platform extends Entity
// NEW: Can be static or moving!
// ============================================
class Platform extends Entity {
    constructor(x, y, width, height, moving = false, moveRange = 0, moveSpeed = 0) {
        super(x, y, width, height, '#795548');
        this.moving = moving;
        this.moveRange = moveRange;
        this.moveSpeed = moveSpeed;
        this.startX = x;
        this.direction = 1;
    }

    // POLYMORPHISM: Platform's update (can move!)
    update() {
        if (this.moving) {
            this.x += this.moveSpeed * this.direction;
            
            if (this.x >= this.startX + this.moveRange) {
                this.x = this.startX + this.moveRange;
                this.direction = -1;
            } else if (this.x <= this.startX) {
                this.x = this.startX;
                this.direction = 1;
            }
        }
    }

    // POLYMORPHISM: Platform's unique render implementation
    render(ctx, cameraX) {
        const screenX = this.x - cameraX;
        
        // Main platform
        ctx.fillStyle = this.moving ? '#FF9800' : this.color;
        ctx.fillRect(screenX, this.y, this.width, this.height);
        
        // Add texture lines
        ctx.strokeStyle = this.moving ? '#F57C00' : '#5D4037';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(screenX + i, this.y);
            ctx.lineTo(screenX + i, this.y + this.height);
            ctx.stroke();
        }
        
        // Highlight on top
        ctx.strokeStyle = this.moving ? '#FFB74D' : '#A1887F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX, this.y);
        ctx.lineTo(screenX + this.width, this.y);
        ctx.stroke();
    }
}

// ============================================
// INHERITANCE: Collectible extends Entity
// POLYMORPHISM: Animated update and render
// ============================================
class Collectible extends Entity {
    constructor(x, y, type = 'coin') {
        super(x, y, 25, 25, '#FFD700');
        
        // ENCAPSULATION: Collectible-specific properties
        this.type = type;
        this.collected = false;
        this.rotation = 0;
        this.bobOffset = 0;
        this.bobSpeed = 0.1;
        
        // Different values and colors for different types
        if (type === 'coin') {
            this.value = 10;
            this.color = '#FFD700';
        } else if (type === 'star') {
            this.value = 50;
            this.color = '#FF6B6B';
        } else if (type === 'heart') {
            this.value = 0;  // Heals instead of points
            this.color = '#E91E63';
        } else if (type === 'doublejump') {
            this.value = 100;
            this.color = '#2196F3';
        }
    }

    // POLYMORPHISM: Collectible's animated update
    update() {
        if (!this.collected) {
            this.rotation += 0.1;
            this.bobOffset = Math.sin(this.rotation * 2) * 5;
        }
    }

    collect() {
        this.collected = true;
        this.active = false;
        return { type: this.type, value: this.value };
    }

    // POLYMORPHISM: Collectible's animated render
    render(ctx, cameraX) {
        if (this.collected || !this.active) return;
        
        const screenX = this.x - cameraX;
        
        ctx.save();
        const renderY = this.y + this.bobOffset;
        ctx.translate(screenX + this.width / 2, renderY + this.height / 2);
        ctx.rotate(this.rotation);
        
        if (this.type === 'coin') {
            // Coin
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFF59D';
            ctx.beginPath();
            ctx.arc(-3, -3, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FFA000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'star') {
            // Star
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * 12;
                const y = Math.sin(angle) * 12;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#C92A2A';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (this.type === 'heart') {
            // Heart
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.bezierCurveTo(-10, -5, -10, -10, 0, -15);
            ctx.bezierCurveTo(10, -10, 10, -5, 0, 5);
            ctx.fill();
        } else if (this.type === 'doublejump') {
            // Double jump power-up
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Arrow up symbol
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(-5, 0);
            ctx.moveTo(0, -6);
            ctx.lineTo(5, 0);
            ctx.moveTo(0, 2);
            ctx.lineTo(-5, 8);
            ctx.moveTo(0, 2);
            ctx.lineTo(5, 8);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// ============================================
// GAME CLASS: Orchestrates all entities
// DEMONSTRATES: How polymorphism works in practice
// ============================================
class Game {
    constructor(canvasId) {
        // ENCAPSULATION: All game state contained here
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Camera for scrolling
        this.cameraX = 0;
        this.levelWidth = 2400;  // 3x wider level!
        
        // Initialize game objects
        this.player = null;
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        
        // Game state
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.keys = {};
        this.isRunning = false;
        this.gameOver = false;
        this.gameWon = false;
        
        this.initLevel();
        
        // Setup controls
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.setupControls();
    }

    initLevel() {
        this.player = new Player(100, 100);
        this.platforms = this.createPlatforms();
        this.enemies = this.createEnemies();
        this.collectibles = this.createCollectibles();
        this.gameOver = false;
        this.gameWon = false;
        this.cameraX = 0;
    }

    createPlatforms() {
        return [
            // Ground sections
            new Platform(0, 550, 400, 50),
            new Platform(500, 550, 400, 50),
            new Platform(1000, 550, 400, 50),
            new Platform(1500, 550, 400, 50),
            new Platform(2000, 550, 400, 50),
            
            // Low platforms
            new Platform(150, 450, 200, 20),
            new Platform(450, 400, 150, 20),
            new Platform(700, 450, 180, 20),
            new Platform(1000, 420, 200, 20),
            new Platform(1300, 450, 150, 20),
            new Platform(1600, 400, 200, 20),
            new Platform(1900, 450, 180, 20),
            new Platform(2150, 420, 200, 20),
            
            // Mid platforms
            new Platform(100, 300, 150, 20),
            new Platform(350, 280, 120, 20),
            new Platform(600, 300, 160, 20),
            new Platform(900, 250, 180, 20),
            new Platform(1200, 300, 150, 20),
            new Platform(1500, 280, 140, 20),
            new Platform(1800, 300, 160, 20),
            new Platform(2100, 250, 150, 20),
            
            // High platforms
            new Platform(200, 150, 120, 20),
            new Platform(500, 180, 140, 20),
            new Platform(800, 150, 120, 20),
            new Platform(1100, 130, 150, 20),
            new Platform(1400, 150, 130, 20),
            new Platform(1700, 180, 140, 20),
            new Platform(2000, 150, 120, 20),
            
            // Moving platforms (NEW!)
            new Platform(400, 350, 100, 15, true, 100, 2),
            new Platform(1000, 200, 100, 15, true, 150, 2),
            new Platform(1600, 250, 100, 15, true, 120, 2),
            
            // Final platform (goal)
            new Platform(2200, 100, 200, 30),
        ];
    }

    createEnemies() {
        return [
            // Ground enemies
            new Enemy(200, 510, 0, 380),
            new Enemy(550, 510, 500, 880),
            new Enemy(1050, 510, 1000, 1380),
            new Enemy(1550, 510, 1500, 1880),
            new Enemy(2050, 510, 2000, 2380),
            
            // Platform enemies
            new Enemy(160, 410, 150, 330),
            new Enemy(460, 360, 450, 580),
            new Enemy(1010, 380, 1000, 1180),
            new Enemy(1610, 360, 1600, 1780),
            
            // Mid-level enemies
            new Enemy(110, 260, 100, 230),
            new Enemy(910, 210, 900, 1060),
            new Enemy(1510, 240, 1500, 1620),
        ];
    }

    createCollectibles() {
        const collectibles = [];
        
        // Coins scattered throughout
        for (let i = 0; i < 30; i++) {
            const x = 200 + i * 70;
            const y = 500 - (i % 3) * 150;
            collectibles.push(new Collectible(x, y, 'coin'));
        }
        
        // Stars (high value)
        collectibles.push(new Collectible(230, 110, 'star'));
        collectibles.push(new Collectible(680, 260, 'star'));
        collectibles.push(new Collectible(1130, 90, 'star'));
        collectibles.push(new Collectible(1730, 140, 'star'));
        collectibles.push(new Collectible(2030, 110, 'star'));
        
        // Hearts (healing)
        collectibles.push(new Collectible(400, 360, 'heart'));
        collectibles.push(new Collectible(1000, 210, 'heart'));
        collectibles.push(new Collectible(1800, 310, 'heart'));
        
        // Double jump power-up
        collectibles.push(new Collectible(800, 110, 'doublejump'));
        
        // Goal star
        collectibles.push(new Collectible(2280, 50, 'star'));
        
        return collectibles;
    }

    setupControls() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
        
        // Jump on spacebar or up arrow
        if ((e.key === ' ' || e.key === 'ArrowUp') && !this.gameOver && !this.gameWon) {
            this.player.jump();
            e.preventDefault();
        }
        
        // Restart on R
        if (e.key === 'r' || e.key === 'R') {
            this.reset();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    handleInput() {
        if (this.gameOver || this.gameWon) return;
        
        if (this.keys['ArrowLeft']) {
            this.player.moveLeft();
        } else if (this.keys['ArrowRight']) {
            this.player.moveRight();
        } else {
            this.player.stop();
        }
    }

    updateCamera() {
        // Camera follows player
        const targetX = this.player.x - this.canvas.width / 3;
        this.cameraX = Math.max(0, Math.min(targetX, this.levelWidth - this.canvas.width));
    }

    // POLYMORPHISM IN ACTION!
    update() {
        if (this.gameOver || this.gameWon) return;
        
        this.handleInput();
        
        // Update player
        this.player.update(this.platforms, this.enemies);
        
        // Update all platforms (including moving ones)
        this.platforms.forEach(platform => platform.update());
        
        // Update all enemies
        this.enemies.forEach(enemy => enemy.update(this.platforms));
        
        // Update all collectibles
        this.collectibles.forEach(collectible => {
            collectible.update();
            
            // Check collection
            if (!collectible.collected && this.player.collidesWith(collectible)) {
                const result = collectible.collect();
                
                if (result.type === 'heart') {
                    this.player.heal(1);
                } else if (result.type === 'doublejump') {
                    this.player.hasDoubleJump = true;
                    this.score += result.value;
                } else {
                    this.score += result.value;
                }
            }
        });
        
        // Check if player defeated an enemy
        this.enemies.forEach(enemy => {
            if (enemy.defeated && !enemy.scoreGiven) {
                this.score += 50;
                enemy.scoreGiven = true;
            }
        });
        
        // Update camera
        this.updateCamera();
        
        // Check game over
        if (!this.player.active) {
            this.gameOver = true;
            if (this.score > this.highScore) {
                this.highScore = this.score;
            }
        }
        
        // Check win condition (reached the end)
        if (this.player.x > 2250) {
            this.gameWon = true;
            if (this.score > this.highScore) {
                this.highScore = this.score;
            }
        }
    }

    // POLYMORPHISM IN ACTION!
    render() {
        // Clear canvas with sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds for depth
        this.drawClouds();
        
        // Render all platforms
        this.platforms.forEach(platform => platform.render(this.ctx, this.cameraX));
        
        // Render all collectibles
        this.collectibles.forEach(collectible => collectible.render(this.ctx, this.cameraX));
        
        // Render all enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx, this.cameraX));
        
        // Render player
        if (this.player.active) {
            this.player.render(this.ctx, this.cameraX);
        }
        
        // Render UI
        this.renderUI();
        
        // Render game over screen
        if (this.gameOver) {
            this.renderGameOver();
        }
        
        // Render win screen
        if (this.gameWon) {
            this.renderWin();
        }
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const cloudOffset = this.cameraX * 0.3; // Parallax effect
        
        for (let i = 0; i < 10; i++) {
            const x = (i * 300 - cloudOffset) % (this.canvas.width + 200);
            const y = 50 + (i % 3) * 80;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30, 0, Math.PI * 2);
            this.ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
            this.ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    renderUI() {
        // Score panel background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 280, 100);
        
        // Score
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 20, 40);
        
        // High score
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`High Score: ${this.highScore}`, 20, 65);
        
        // Progress
        const progress = Math.floor((this.player.x / this.levelWidth) * 100);
        this.ctx.fillText(`Progress: ${progress}%`, 20, 85);
        
        // Health hearts
        this.ctx.fillStyle = '#F44336';
        this.ctx.font = '24px Arial';
        let hearts = '❤️'.repeat(this.player.health);
        let emptyHearts = '🖤'.repeat(this.player.maxHealth - this.player.health);
        this.ctx.fillText(hearts + emptyHearts, 20, 105);
        
        // Controls hint
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 90, 320, 80);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('← → Arrow keys to move', 20, this.canvas.height - 65);
        this.ctx.fillText('↑ or Space to jump', 20, this.canvas.height - 45);
        
        if (this.player.hasDoubleJump) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('✨ Double Jump Unlocked!', 20, this.canvas.height - 25);
        } else {
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillText('Jump on enemies to defeat them!', 20, this.canvas.height - 25);
        }
    }

    renderGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game Over text
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Final score
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '30px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // High score
        if (this.score === this.highScore && this.score > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
        
        // Restart instruction
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 100);
        
        this.ctx.textAlign = 'left';
    }

    renderWin() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Victory text
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎉 VICTORY! 🎉', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Final score
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '30px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // High score
        if (this.score === this.highScore) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('🏆 NEW HIGH SCORE! 🏆', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
        
        // Restart instruction
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press R to Play Again', this.canvas.width / 2, this.canvas.height / 2 + 100);
        
        this.ctx.textAlign = 'left';
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    start() {
        if (this.isRunning) return;  // Don't start if already running!
        this.isRunning = true;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    reset() {
        this.stop();  // Stop first!
        this.score = 0;
        this.level = 1;
        this.initLevel();
        this.start();  // Then start fresh
    }
   
}

// ============================================
// Initialize and start the game
// ============================================
const game = new Game('gameCanvas');
game.start();
