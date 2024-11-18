const playButton = document.getElementById('startGameBtn');
const startGameContainer = document.getElementById('startGame');
const inGameContainer = document.getElementById('insideGameContainer');
const endGameContainer = document.getElementById('gameEndDiv');
const returnHomeButton = document.getElementById('returnHome');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
document.getElementById('highScore').textContent = highScore;
document.getElementById('homeHighScore').textContent = highScore;

let ballArray = [];
let enemyBombArray = [];
let isGameEnd = false;
let isGamePause = false;

let mouseX = 0;
let mouseY = 0;
let isMouseClicked = false;
let linesArray = [];

// Ball Class (Game Object)
class Ball {
    constructor(x = Math.random() * canvas.width, y = canvas.height * 0.75, size = Math.random() * 20 + 20, speedX = Math.random() * 2 - 1, speedY = -12) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
        this.shrinkRate = .2; // Shrink rate after slicing
        this.lifetime = 200; // Frames before ball disappears
        this.sliced = false; // To track if ball is sliced
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;                      
        this.speedY += 0.3; // Gravity effect

        // Shrink ball after slicing
        if (this.sliced && this.lifetime > 0) {
            this.size -= this.shrinkRate; // Shrink the ball
            this.lifetime--; // Decrease lifetime

            // Remove ball if it shrinks too small
            if (this.size <= 0 || this.lifetime <= 0) {
                this.size = 0;
            }
        }
    }

    draw() {
        if (this.size > 0) {
            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fillStyle = this.color;
            context.fill();
            context.closePath();
        }
    }
}

// Ball Spawning Function
function spawnBalls() {
    if (isGameEnd) return;

    ballArray.push(new Ball());
    if (Math.random() > 0.7) enemyBombArray.push(new EnemyBomb());

    setTimeout(spawnBalls, 1000);
}

// Ball Slicing Mechanism (Mouse or Touch Interaction)
function sliceBall(index) {
    const ball = ballArray[index];
    if (ball && !ball.sliced) {
        // Split the ball into two smaller pieces
        ballArray.push(new Ball(ball.x - 10, ball.y, ball.size / 2, ball.speedX, ball.speedY));
        ballArray.push(new Ball(ball.x + 10, ball.y, ball.size / 2, ball.speedX, ball.speedY));

        ball.sliced = true;
        ballArray.splice(index, 1); // Remove the original ball

        // Increase score
        updateScore(5);
    }
}

// Collision Detection for Slicing
function detectCollisionWithBalls(x, y) {
    ballArray.forEach((ball, index) => {
        const distance = Math.hypot(x - ball.x, y - ball.y);
        if (distance < ball.size) {
            sliceBall(index);
        }
    });
}

// Update Score and High Score
function updateScore(value) {
    score += value;
    if (score < 0) score = 0;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }

    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('homeHighScore').textContent = highScore;
}

// Game Over Logic
function endGame() {
    isGameEnd = true;
    ballArray = [];
    enemyBombArray = [];
    inGameContainer.style.display = 'none';
    endGameContainer.style.display = 'block';
    document.getElementById('endGameScore').textContent = score;
}

// Timer Logic
let gameDuration = 120; // 2 minutes
function startTimer() {
    let remainingTime = gameDuration;

    const interval = setInterval(() => {
        if (isGameEnd) {
            clearInterval(interval);
            return;
        }

        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        document.getElementById('timerDisplay').textContent = `${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;

        if (remainingTime === 0) {
            clearInterval(interval);
            endGame();
        }
        remainingTime--;
    }, 1000);
}

// Rendering Balls and Bombs
function renderBalls() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    ballArray.forEach((ball, index) => {
        ball.update();
        ball.draw();

        // Remove ball if it shrinks to 0 or falls off the screen
        if (ball.y > canvas.height + ball.size || ball.size <= 0) {
            ballArray.splice(index, 1);
        }
    });

    enemyBombArray.forEach((bomb, index) => {
        bomb.update();
        bomb.draw();

        // Remove bomb if it goes off-screen
        if (bomb.y > canvas.height + bomb.size) {
            enemyBombArray.splice(index, 1);
        }
    });

    if (!isGameEnd) {
        requestAnimationFrame(renderBalls);
    }
}

// Mouse Handling for Ball Slicing (Without Redundancy)
canvas.addEventListener('mousedown', (e) => {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    detectCollisionWithBalls(mouseX, mouseY);
});

canvas.addEventListener('mousemove', (e) => {
    if (isMouseClicked) {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;
        detectCollisionWithBalls(mouseX, mouseY);
    }
});

canvas.addEventListener('mouseup', () => {
    isMouseClicked = false;
});

canvas.addEventListener('mouseout', () => {
    isMouseClicked = false;
});

// Handle Touch Event for Mobile Devices
canvas.addEventListener('touchstart', (e) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    detectCollisionWithBalls(touchX, touchY);
});

// Start and Restart Game
playButton.addEventListener('click', () => {
    isGameEnd = false;
    startGame();
    spawnBalls();
});

returnHomeButton.addEventListener('click', () => {
    startGameContainer.style.display = 'block';
    endGameContainer.style.display = 'none';
});

// Game Start Logic
function startGame() {
    startGameContainer.style.display = 'none';
    inGameContainer.style.display = 'block';
    score = 0;
    updateScore(0);
    renderBalls();
    startTimer();
}

// Ball Class for Bombs (Not used in slicing, but in the full game logic)
class EnemyBomb {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.size = 30;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = -10;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.3;
    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = 'white';
        context.strokeStyle = 'red';
        context.lineWidth = 3;
        context.stroke();
        context.fill();
        context.closePath();
    }
}
