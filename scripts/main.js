/**
 * @brief 2D point implementation.
 */
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  toString() {
    return `Point(${this.x}, ${this.y})`;
  }
}

/**
 * @brief Size implementation.
 */
class Size {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  toString() {
    return `Size(${this.width}x${this.height})`;
  }
}

/**
 * @brief Velocity implementation.
 */
class Velocity {
  constructor(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  toString() {
    return `Velocity[${this.vx},${this.vy}]`;
  }
}

// Initial fruit image size (not sliced)
const FruitImageSize = new Size(90, 90);
// Initial fruit images (not sliced)
const FruitImages = ["images/apple.png", "images/banana.png", "images/cherry.png", "images/coconut.png", "images/grapes.png", "images/mango.png", "images/pear.png", "images/pineapple.png"];
// new Fruit is spawned every 3 sec.
const FruitSpawnInterval = 3000;
// Fruit position is updated every 20 msec
const FruitMoveInterval = 20;
// Fruit flies across the screen up to 6 seconds
const FruitFlyingInterval = 6000;

const SliceDirection = Object.freeze({
  Vertical: 0,
  Horizontal: 1,
});

/**
 * @brief Fruit object implementation.
 */
class Fruit {
  /**
   * @brief Fruit object constructor.
   *
   * @param position Initial position of a fruit.
   * @param velocity Initial velocity of a fruit.
   * @param gravity Fruit gravity.
   * @param imagePath Path to a fruit image.
   * @param imageSize Size of an image displayed on the canvas.
   * @param loadedCallback Callback to notify image load.
   */
  constructor(position, velocity, gravity, imagePath, imageSize, loadedCallback) {
    this.position = position;
    this.velocity = velocity;
    this.gravity = gravity;
    this.imageSize = imageSize;
    this.image = new Image();
    this.image.onload = () => {
      loadedCallback(this);
    };
    this.image.src = imagePath;
    this.sliced = false;
  }

  /**
   * @brief Returns image path of a fruit.
   */
  imagePath() {
    return this.image.src;
  }

  /**
   * @brief Returns true if a fruit is sliced.
   */
  isSliced() {
    return this.sliced;
  }

  /**
   * @brief Returns true if an object is a bomb.
   */
  isBomb() {
    return this.imagePath().includes("bomb");
  }

  /**
   * @brief Returns true if an object is a fruit.
   */
  isFruit() {
    return !this.isBomb();
  }

  /**
   * @brief Slices a fruit.
   */
  slice() {
    this.sliced = true;
  }

  /**
   * @brief Draws a fruit on a 2D context.
   *
   * @param ctx 2D context to draw a fruit.
   */
  draw(ctx) {
    ctx.drawImage(this.image, this.position.x, this.position.y, this.imageSize.width, this.imageSize.height);
  }

  /**
   * @brief Updated position of a fruit.
   */
  move() {
    this.position.x += this.velocity.vx;
    this.velocity.vy += this.gravity;
    this.position.y += this.velocity.vy;
  }
}

/**
 * @brief Board object implementation.
 */
class Board {
  /**
   * @brief Board object constructor.
   *
   * @param backgroundImage Background image.
   * @param missedFruitCallback Called when a whole fruit falls below the board.
   * @param slicedBombCallback Called when a bomb is sliced.
   * @param slicedFruitCallback Called when a fruit is sliced.
   */
  constructor(backgroundImage, missedFruitCallback, slicedBombCallback, slicedFruitCallback) {
    // initialize callbacks
    this.backgroundImage = backgroundImage;
    this.missedFruitCallback = missedFruitCallback;
    this.slicedBombCallback = slicedBombCallback;
    this.slicedFruitCallback = slicedFruitCallback;

    // initialize 2d context
    this.canvas = document.getElementById("canvas");
    this.canvas.style.cursor = "none";
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.addEventListener("mousemove", (event) => {
      this.processMouseEvent(event);
    });
    this.ctx = canvas.getContext("2d");

    // flying objects
    this.fruits = [];

    // initial mouse position
    this.mousePosition = new Point(-10, -10);

    /***@StrikeCounter function */
    this.strikeCount = 0; // Track simultaneous slices
    this.strikeCountDiv = document.getElementById("strikeCountDiv"); // Reference the HTML element
  }

  /** @brief update the strike count */
  updateStrikeCountDisplay(multiplier) {
    if (!this.strikeCountDiv) return;

    const strikeCountElement = this.strikeCountDiv.querySelector(".strikeCount");
    strikeCountElement.textContent = `${multiplier}x`;

    // Show the strike count UI
    this.strikeCountDiv.style.display = "block";

    // Hide it after 1 second
    setTimeout(() => {
      this.strikeCountDiv.style.display = "none";
    }, 1000);
  }

  /**
   * @brief Generates random position for a fruit.
   *
   * 5% margin left and 5% margin right applied to the working area.
   *
   * @param width Width of the canvas.
   * @param height Height of the canvas.
   * @return Fruit position.
   */
  static randomPosition(width, height) {
    const Margin = 0.05;
    const x = Math.floor(width * Margin + Math.random() * (width * (1 - 2 * Margin) - FruitImageSize.width));
    return new Point(x, height);
  }

  /**
   * @brief Generates random velocity for a fruit.
   *
   * Fruit is expected to start falling in the top half of a screen.
   * The exact fall position is randomized in range [0.05 * height / 2,
   * 0.95 * height / 2].
   * Uniformly accelerated equations are used to calculate initial
   * velocity for a fruit.
   *
   * @param startPosition Starting position of a fruit.
   * @param width Width of the canvas.
   * @param height Height of the canvas.
   * @param gravity Gravity pulling fruit down.
   * @param flyingInterval Fruit total flying time.
   * @return Fruit velocity.
   */
  static randomVelocity(startPosition, width, height, gravity, flyingInterval) {
    const Margin = 0.05;
    // The point where a fruit will start to fall due to the Gravity.
    const peekHeight = (height / 2) * (Margin + Math.random() * (1 - Margin));
    // The distance fruit travelled before falling.
    const distanceY = height - peekHeight;
    // The time needed for a fruit to free fall.
    const fallingTime = Math.floor(Math.sqrt((distanceY * 2) / gravity) + 0.5);
    const risingTime = flyingInterval / FruitMoveInterval - fallingTime;
    // The initial velocity needed for a fruit to reach peekHeight.
    const velocityY = -(distanceY + (gravity * risingTime * risingTime) / 2) / risingTime;
    const distanceX = width / 2 - startPosition.x;
    const velocityX = ((distanceX * 2) / flyingInterval) * FruitMoveInterval;
    return new Velocity(velocityX, velocityY);
  }

  /**
   * @brief Generates sliced image filepaths.
   *
   * Transforms "images/apple.png" into ["images/apple_v1.png", "images/apple_v2.png"]
   * in case of a vertical slice, or into ["images/apple_h1.png", "images/apple_h2.png"]
   * in case of a horizontal slice.
   *
   * @note Images are sliced in the middle.
   *
   * @param originalPath Path of the original image (not sliced).
   * @param direction Direction of a slice (vertical or horizontal).
   * @return Array of sliced image paths.
   */
  static slicedImagePaths(originalPath, direction) {
    const path = originalPath.substr(originalPath.lastIndexOf("/") + 1);
    const suffix = direction === SliceDirection.Vertical ? "_v" : "_h";
    return ["images/" + path.replace(".", suffix + "1."), "images/" + path.replace(".", suffix + "2.")];
  }

  /**
   * @brief Detects slice direction based on two points.
   *
   * @param from Previous mouse position.
   * @param to Current mouse position.
   * @return Direction of a slice.
   */
  static getSliceDirection(from, to) {
    const deltaX = Math.abs(to.x - from.x);
    const deltaY = Math.abs(to.y - from.y);
    return deltaX > deltaY ? SliceDirection.Horizontal : SliceDirection.Vertical;
  }

  processMouseEvent(event) {
    const newPosition = new Point(event.pageX, event.pageY);
    const sliceAudio = new Audio("audio/Slice.wav");
    const sliceDirection = Board.getSliceDirection(this.mousePosition, newPosition);
    this.mousePosition = newPosition;

    for (let i = 0; i < this.fruits.length; ) {
      if (this.fruits[i].isSliced()) {
        ++i;
        continue;
      }

      const topLeft = this.fruits[i].position;
      const bottomRight = new Point(topLeft.x + this.fruits[i].imageSize.width, topLeft.y + this.fruits[i].imageSize.height);

      if (this.mousePosition.x >= topLeft.x && this.mousePosition.y >= topLeft.y && this.mousePosition.x <= bottomRight.x && this.mousePosition.y <= bottomRight.y) {
        // mouse position is inside a fruit image
        this.slice(this.fruits[i], sliceDirection);
        sliceAudio.play();
      } else {
        ++i;
      }
    }
  }

  /**
   * @brief Generates random fruit.
   */
  generateRandomFruit(gravity, flyingInterval) {
    const image = FruitImages[Math.floor(Math.random() * FruitImages.length)];
    const position = Board.randomPosition(this.canvas.width, this.canvas.height);
    const velocity = Board.randomVelocity(position, this.canvas.width, this.canvas.height, gravity, flyingInterval);

    const fruit = new Fruit(position, velocity, gravity, image, FruitImageSize, (fruit) => {
      this.fruits.push(fruit);
    });
  }

  /**
   * @brief Generates a bomb.
   */
  generateBomb(gravity, flyingInterval) {
    const image = "images/bomb.png";

    const position = Board.randomPosition(this.canvas.width, this.canvas.height);
    const velocity = Board.randomVelocity(position, this.canvas.width, this.canvas.height, gravity, flyingInterval);

    const bomb = new Fruit(position, velocity, gravity, image, FruitImageSize, (bomb) => {
      this.fruits.push(bomb);
    });
  }

  /**
   * @brief Draws fruits on a canvas.
   */
  drawElements() {
    // Clear only the fruit part of the canvas to retain the trail
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.shadowBlur = 0;
    // Draw fruits
    this.fruits.forEach((fruit) => {
      fruit.draw(this.ctx);
    });

    const x = this.mousePosition.x;
    const y = this.mousePosition.y;

    // Draw mouse trail
    if (this.lastX !== null && this.lastY !== null) {
      this.ctx.strokeStyle = `rgba(255, 255, 255, 0.7)`;
      this.ctx.lineWidth = 5;
      this.ctx.lineCap = "round";
      this.ctx.shadowBlur = 10; // Add a blur effect to the line
      this.ctx.shadowColor = `rgba(255, 255, 255, 0.7)`;

      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();

      // Add a few more points to the path to create a longer trail
      this.ctx.lineTo(x + (x - this.lastX) * 0.5, y + (y - this.lastY) * 0.5);
      this.ctx.lineTo(x + (x - this.lastX) * 1.5, y + (y - this.lastY) * 1.5);
      this.ctx.stroke();
    }

    this.lastX = x;
    this.lastY = y;
  }

  /**
   * @brief Updated fruit position.
   *
   * Fruits outside of canvas (too far below, too far right or too far left)
   * are removed.
   */
  moveFruits() {
    this.fruits.forEach((fruit) => {
      fruit.move();

      // handle a missed fruit
      if (!fruit.isSliced() && !fruit.isBomb() && fruit.position.y > this.canvas.height) {
        this.missedFruitCallback();
      }
    });

    // remove fruits outside of the canvas
    this.fruits = this.fruits.filter(
      (fruit) =>
        fruit.position.y <= this.canvas.height && // too far below
        fruit.position.x <= this.canvas.width && // too far left
        fruit.position.x >= -fruit.imageSize.width // too fat right
    );
  }

  /**
   * @brief Slices a fruit.
   *
   * Removes sliced image from canvas, two fruits that represent sliced
   * halves are added.
   *
   * @param fruit Fruit that had been sliced.
   * @param direction Direction of a slice.
   */
  slice(fruit, direction) {
    fruit.slice();
    if (fruit.isBomb()) {
      this.slicedBombCallback("You've sliced a bomb");
      return;
    }

    this.slicedFruitCallback();
    this.strikeCount++;

    const slicedImages = Board.slicedImagePaths(fruit.imagePath(), direction);
    // half one <-
    const imageSize = direction === SliceDirection.Horizontal ? new Size(FruitImageSize.width, FruitImageSize.height / 2) : new Size(FruitImageSize.width / 2, FruitImageSize.height);
    let velocityX = fruit.velocity.vx < 0 ? fruit.velocity.vx : -fruit.velocity.vx;
    let halfOne = new Fruit(new Point(fruit.position.x, fruit.position.y), new Velocity(velocityX, 0), fruit.gravity, slicedImages[0], imageSize, (fruit) => {
      this.fruits.push(fruit);
    });
    halfOne.slice();
    // half two ->
    const positionX = imageSize.width == FruitImageSize.width ? fruit.position.x : fruit.position.x + imageSize.width;
    const positionY = imageSize.width == FruitImageSize.width ? fruit.position.y + imageSize.height : fruit.position.y;
    velocityX = Math.abs(fruit.velocity.vx);
    const halfTwo = new Fruit(new Point(positionX, positionY), new Velocity(velocityX, 0), fruit.gravity, slicedImages[1], imageSize, (fruit) => {
      this.fruits.push(fruit);
    });
    halfTwo.slice();
    this.fruits.splice(this.fruits.indexOf(fruit), 1);
    this.updateStrikeCountDisplay(this.strikeCount);

    // Reset the strike count after a brief delay
    setTimeout(() => {
      this.strikeCount = 0; // Reset for the next slicing event
    }, 100);
  }
}

class GameEngine {
  static backGroundImage() {
    const backgroundImage = new Image();
    backgroundImage.src = "images/background.jpg";
    return backgroundImage;
  }

  /**
   * @brief Calculates gravity applied to a fruit.
   *
   * It's assumed that a free-falling fruit should traverse canvas
   * within fruitFlyingInterval / 2.
   * Uniformly accelerated movement equations are used to calculate
   * the gravity: g = (2 * S) / (t * t);
   *
   * @param fruitFlyingInterval Current fruit flying time.
   * @return Fruit position.
   */
  static calculateGravity(fruitFlyingInterval) {
    const time = fruitFlyingInterval / 2 / FruitMoveInterval;
    return (window.innerHeight * 2) / time / time;
  }

  constructor() {
    // these member members should not change during the game
    this.maxMisses = 3;
    this.chanceImages = [document.getElementById("chance1"), document.getElementById("chance2"), document.getElementById("chance3")];
    // Show all chances
    this.chanceImages.forEach((image) => (image.style.display = "block"));

    this.fruitSpawnInterval = FruitSpawnInterval;
    this.fruitFlyingInterval = FruitFlyingInterval;
    // Gravity causes fruit to slow down and eventually fall
    this.gravity = GameEngine.calculateGravity(this.fruitFlyingInterval);
    this.fruitsTillNextBomb = Math.floor(Math.random() * 4) + 4;
    this.board = new Board(
      GameEngine.backGroundImage(),
      () => {
        this.updateMissedFruits();
      },
      (message) => {
        this.gameOver(message);
      },
      () => {
        this.updateScore();
      }
    );
    this.isPaused = false;

    this.missedFruits = 0;
    this.currentScore = 0;
    this.highScore = localStorage.getItem("highScore") || 0; // Retrieve saved high score
    // Update the high score span on page load
    document.getElementById("highScore").textContent = this.highScore;
    document.getElementById("homeHighScore").textContent = this.highScore;
  }

  updateMissedFruits() {
    // Remove the image
    this.chanceImages[this.missedFruits++].style.display = "none";

    if (this.missedFruits === this.maxMisses) {
      this.gameOver("You've missed three fruits");
    }
  }

  loop() {
    this.board.drawElements();
    requestAnimationFrame(() => {
      this.loop();
    });
  }

  spawnFruit() {
    const times = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < times; i++) {
      this.board.generateRandomFruit(this.gravity, this.fruitFlyingInterval);
    }

    this.fruitsTillNextBomb -= times;
    if (this.fruitsTillNextBomb <= 0) {
      this.fruitsTillNextBomb = Math.floor(Math.random() * 4) + 4;
      this.board.generateBomb(this.gravity, this.fruitFlyingInterval);
    }
  }

  start() {
    // start spawning the fruits
    this.fruitSpawnIntervalId = setInterval(() => {
      this.spawnFruit();
    }, this.fruitSpawnInterval);
    // start moving the fruits
    this.fruitMoveIntervalId = setInterval(() => {
      this.board.moveFruits();
    }, FruitMoveInterval);
    // generate first fruit
    this.board.generateRandomFruit(this.gravity, this.fruitFlyingInterval);
    game.loop();
  }

  pause() {
    this.isPaused = true;
    // stop all activity
    clearInterval(this.fruitSpawnIntervalId);
    clearInterval(this.fruitMoveIntervalId);
  }

  resume() {
    if (!this.isPaused) {
      return;
    }

    this.isPaused = false;
    // start spawning the fruits
    this.fruitSpawnIntervalId = setInterval(() => {
      this.spawnFruit();
    }, this.fruitSpawnInterval);
    // start moving the fruits
    this.fruitMoveIntervalId = setInterval(() => {
      this.board.moveFruits();
    }, FruitMoveInterval);
  }

  gameOver(message) {
    // stop all activity
    clearInterval(this.fruitSpawnIntervalId);
    clearInterval(this.fruitMoveIntervalId);
    // show an alert
    alert("Game over! " + message);
  }

  // Update score display
  updateScore() {
    // TODO multiply by x strokes
    const newPoints = 10;
    this.currentScore += newPoints;
    document.getElementById("score").textContent = this.currentScore;

    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      document.getElementById("highScore").textContent = this.highScore;
      localStorage.setItem("highScore", this.highScore); // Save new high score
    }

    // update fruit speed every 100 points
    // TO BE DISCUSSED
    if (this.currentScore > 0 && this.currentScore % 100 === 0) {
      this.fruitFlyingInterval -= FruitFlyingInterval / 20;
      this.gravity = GameEngine.calculateGravity(this.fruitFlyingInterval);
    }
  }
}

const game = new GameEngine();

// Audio Controlls
const audio = document.getElementById("audio");
const muteButton = document.getElementById("muteButton");

// Attempt to play audio on page load
window.addEventListener("load", () => {
  audio.play().catch((error) => {
    console.log("Autoplay blocked. User interaction required.");
    muteButton.innerHTML = "<i class='fas fa-volume-mute'></i>";
  });
});

// Set initial button state
muteButton.innerHTML = audio.muted ? "<i class='fas fa-volume-mute'></i>" : "<i class='fas fa-volume-up'></i>";

// Mute/unmute toggle
muteButton.addEventListener("click", () => {
  if (audio.muted) {
    audio.muted = false;
    audio.play().catch((error) => console.log("Playback error:", error));
    muteButton.innerHTML = "<i class='fas fa-volume-up'></i>";
  } else {
    audio.muted = true;
    muteButton.innerHTML = "<i class='fas fa-volume-mute'></i>";
  }
});

let audioPlaying = false;
// Pause game when the page is hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("hidden");
    audioPlaying = !audio.isPaused && audio.currentTime > 0;
    if (audioPlaying) {
      audio.pause();
    }
    game.pause();
  } else {
    console.log("visible");
    if (audioPlaying) {
      audio.play();
    }
    game.resume();
  }
});

// Pause game when "play" is clicked
document.getElementById("startGameBtn").addEventListener("click", () => {
  document.getElementById("startGame").style.display = "none";
  document.getElementById("insideGameContainer").style.display = "flex";
  game.start();
});
