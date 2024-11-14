const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let fruits = [];
let missedFruits = 0;
const maxMissedFruits = 3;

class Fruit {
  constructor(x, y, width, height, image) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
    this.sliced = false;
    this.vx = Math.random() * 1 - 0.5;
    this.vy = -(Math.random() * 0.5 + 0.5);
  }

  draw(ctx) {
    if (!this.sliced) {
      ctx.drawImage(this.image, this.x, this.y, 30, 30);
    }
  }
    
  slice() {
    this.sliced = true;
  }
}

function spawnFruit() {
  const fruitImages = ['images/banana.png', 'images/pineapple.png', 'images/apple.png', 'images/cherry.png', 'images/pear.png', 'images/coconut.png']; 
  const randomImage = fruitImages[Math.floor(Math.random() * fruitImages.length)];
  const centerBandWidth = canvas.width * 0.5; 
  const x = (canvas.width - centerBandWidth) / 2 + Math.random() * centerBandWidth;
  const y = canvas.height; 
  const width = 50 + Math.random() * 50;
  const height = 50 + Math.random() * 50;
  
  const fruit = new Fruit(x, y, width, height, new Image());
  fruit.image.src = randomImage;
  
  fruit.image.onload = () => {
    fruits.push(fruit); 
  };
}

function updateGameObjects() {
  for (let i = fruits.length - 1; i >= 0; i--) {
    let fruit = fruits[i];
    
    fruit.x -= fruit.vx;
    fruit.y += fruit.vy;

    if (fruit.vy < 0 && fruit.y < canvas.height - 100) {
      fruit.vy = Math.abs(fruit.vy); 
    }

    
    if (fruit.y > canvas.height) {
      missedFruits++;
      fruits.splice(i, 1); 
    }
  }
}

function drawGameObjects() {
  fruits.forEach(fruit => {
    fruit.draw(ctx); 
  });
}

function checkGameOver() {
  if (missedFruits >= maxMissedFruits) {
    alert('Game Over! Too many missed fruits!');
    fruits = [];
    missedFruits = 0;
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); 
  updateGameObjects(); 
  drawGameObjects(); 
  checkGameOver(); 
  
  requestAnimationFrame(gameLoop); 
}

gameLoop();


setInterval(spawnFruit, 3000);