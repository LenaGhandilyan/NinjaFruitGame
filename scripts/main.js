const playButton = document.getElementById('startGameBtn');
const startGameContainer = document.getElementById('startGame');
const inGameContainer = document.getElementById('insideGameContainer');
const endGameContainer = document.getElementById('gameEndDiv');
const returnHomeButton = document.getElementById('returnHome');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
document.getElementById('highScore').textContent = highScore;
document.getElementById('homeHighScore').textContent = highScore;

let ballArray = [];
let enemyBombArray = [];
let isGameEnd = false;
let isGamePause = false;

// Ball Class
function Ball() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height;
    this.size = Math.random() * 20 + 20;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = -10;
    this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;

    this.update = function () {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.3;
    };

    this.draw = function () {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.fill();
        context.closePath();
    };
}

// Bomb Class
function EnemyBomb() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height;
    this.size = 30;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = -10;

    this.update = function () {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.3;
    };

    this.draw = function () {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = 'white';
        context.strokeStyle = 'red';
        context.lineWidth = 3;
        context.stroke();
        context.fill();
        context.closePath();
    };
}

// Game logic
function startGame() {
    startGameContainer.style.display = 'none';
    inGameContainer.style.display = 'block';
    score = 0;
    updateScore(0);
    renderBalls();
    startTimer();
}

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

function endGame() {
    isGameEnd = true;
    ballArray = [];
    enemyBombArray = [];
    inGameContainer.style.display = 'none';
    endGameContainer.style.display = 'block';
    document.getElementById('endGameScore').textContent = score;
}

// Timer
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

// Rendering
function renderBalls() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    ballArray.forEach((ball, index) => {
        ball.update();
        ball.draw();

        if (ball.y > canvas.height + ball.size) {
            ballArray.splice(index, 1);
        }
    });

    enemyBombArray.forEach((bomb, index) => {
        bomb.update();
        bomb.draw();

        if (bomb.y > canvas.height + bomb.size) {
            enemyBombArray.splice(index, 1);
        }
    });

    if (!isGameEnd) {
        requestAnimationFrame(renderBalls);
    }
}

function spawnBalls() {
    if (isGameEnd) return;

    ballArray.push(new Ball());
    if (Math.random() > 0.7) enemyBombArray.push(new EnemyBomb());

    setTimeout(spawnBalls, 1000);
}

// Event Listeners
playButton.addEventListener('click', () => {
    isGameEnd = false;
    startGame();
    spawnBalls();
});

returnHomeButton.addEventListener('click', () => {
    startGameContainer.style.display = 'block';
    endGameContainer.style.display = 'none';
});
