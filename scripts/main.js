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
const FruitImages = [
  "images/apple.png",
  "images/banana.png",
  "images/cherry.png",
  "images/coconut.png",
  "images/grapes.png",
  "images/mango.png",
  "images/pear.png",
  "images/pineapple.png",
];
// new Fruit is spawned every 3 sec.
const FruitSpawnInterval = 3000;
// Fruit position is updated every 20 msec
const FruitMoveInterval = 20;
// Fruit flies across the screen up to 6 seconds
const FruitFlyingInterval = 6000;

/**
 * @brief Calculates gravity applied to a fruit.
 *
 * It's assumed that a free-falling fruit should traverse canvas
 * within FruitFlyingInterval / 2 sec.
 * Uniformly accelerated movement equations are used to calculate
 * the gravity: g = (2 * S) / (t * t);
 *
 * @return Fruit position.
 */
function calculateGravity() {
  const time = FruitFlyingInterval / 2 / FruitMoveInterval;
  return (window.innerHeight * 2) / time / time;
}

// Gravity causes fruit to slow down and eventually fall
const Gravity = calculateGravity();

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
   * @param imagePath Path to a fruit image.
   * @param imageSize Size of an image displayed on the canvas.
   * @param loadedCallback Callback to notify image load.
   */
  constructor(position, velocity, imagePath, imageSize, loadedCallback) {
    this.position = position;
    this.velocity = velocity;
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
    ctx.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.imageSize.width,
      this.imageSize.height
    );
  }

  /**
   * @brief Updated position of a fruit.
   */
  move() {
    this.position.x += this.velocity.vx;
    this.velocity.vy += Gravity;
    this.position.y += this.velocity.vy;
  }
}

/**
 * @brief Board object implementation.
 */
class Board {
  /**
   * @brief Board object constructor.
   */
  constructor() {
    this.canvas = document.getElementById("canvas");
    canvas.style.cursor = "none";
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.addEventListener("mousemove", (event) => {
      this.processMouseEvent(event);
    });
    this.ctx = canvas.getContext("2d");
    this.fruits = [];
    this.fruitMoveIntervalId = setInterval(() => {
      this.moveFruits();
    }, FruitMoveInterval);
    this.fruitSpawnIntervalId = setInterval(() => {
      this.generateRandomFruit();
    }, FruitSpawnInterval);
    this.mousePosition = new Point(-10, -10);

    // Mouse trail properties

    this.lastX = null;
    this.lastY = null;

    this.canvas.addEventListener("mousemove", (event) => {
      this.processMouseEvent(event);
    });

    this.fruitCount = 0;
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
    const x = Math.floor(
      width * Margin +
        Math.random() * (width * (1 - 2 * Margin) - FruitImageSize.width)
    );
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
   * @return Fruit velocity.
   */
  static randomVelocity(startPosition, width, height) {
    const Margin = 0.05;
    // The point where a fruit will start to fall due to the Gravity.
    const peekHeight = (height / 2) * (Margin + Math.random() * (1 - Margin));
    // The distance fruit travelled before falling.
    const distanceY = height - peekHeight;
    // The time needed for a fruit to free fall.
    const fallingTime = Math.floor(Math.sqrt((distanceY * 2) / Gravity) + 0.5);
    const risingTime = FruitFlyingInterval / FruitMoveInterval - fallingTime;
    // The initial velocity needed for a fruit to reach peekHeight.
    const velocityY =
      -(distanceY + (Gravity * risingTime * risingTime) / 2) / risingTime;
    const distanceX = width / 2 - startPosition.x;
    const velocityX =
      ((distanceX * 2) / FruitFlyingInterval) * FruitMoveInterval;
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
    return [
      "images/" + path.replace(".", suffix + "1."),
      "images/" + path.replace(".", suffix + "2."),
    ];
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
    return deltaX > deltaY
      ? SliceDirection.Horizontal
      : SliceDirection.Vertical;
  }

  processMouseEvent(event) {
    const newPosition = new Point(event.pageX, event.pageY);
    const sliceDirection = Board.getSliceDirection(
      this.mousePosition,
      newPosition
    );
    this.mousePosition = newPosition;

    for (let i = 0; i < this.fruits.length; ) {
      if (this.fruits[i].isSliced()) {
        ++i;
        continue;
      }

      const topLeft = this.fruits[i].position;
      const bottomRight = new Point(
        topLeft.x + this.fruits[i].imageSize.width,
        topLeft.y + this.fruits[i].imageSize.height
      );

      if (
        this.mousePosition.x >= topLeft.x &&
        this.mousePosition.y >= topLeft.y &&
        this.mousePosition.x <= bottomRight.x &&
        this.mousePosition.y <= bottomRight.y
      ) {
        // mouse position is inside a fruit image
        this.slice(this.fruits[i], sliceDirection);
      } else {
        ++i;
      }
    }
  }

  /**
   * @brief Generates random fruit.
   */
  generateRandomFruit() {
    if (this.fruitCount > 0 && this.fruitCount % 10 === 0) {
      this.generateBomb();
      return;
    }

    const image = FruitImages[Math.floor(Math.random() * FruitImages.length)];
    const position = Board.randomPosition(
      this.canvas.width,
      this.canvas.height
    );
    const velocity = Board.randomVelocity(
      position,
      this.canvas.width,
      this.canvas.height
    );

    const fruit = new Fruit(
      position,
      velocity,
      image,
      FruitImageSize,
      (fruit) => {
        this.fruitCount += 1;
        this.fruits.push(fruit);
      }
    );
  }

  /**
   * @brief Generates a bomb.
   */
  generateBomb() {
    const image = "images/bomb.png";

    const position = Board.randomPosition(
      this.canvas.width,
      this.canvas.height
    );
    const velocity = Board.randomVelocity(
      position,
      this.canvas.width,
      this.canvas.height
    );

    const bomb = new Fruit(
      position,
      velocity,
      image,
      FruitImageSize,
      (bomb) => {
        this.fruitCount += 1;
        this.fruits.push(bomb);
      }
    );
  }

  /**
   * @brief Draws fruits on a canvas.
   */
  drawElements() {
    // Clear only the fruit part of the canvas to retain the trail
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw fruits
    this.fruits.forEach((fruit) => {
      fruit.draw(this.ctx);
    });

    const x = this.mousePosition.x;
    const y = this.mousePosition.y;

    // Draw mouse trail
    if (this.lastX !== null && this.lastY !== null) {
      const deltaX = x - this.lastX;
      const deltaY = y - this.lastY;

      // Extend the starting point of the line backward to make it longer
      const extendedX = this.lastX - deltaX * 2;
      const extendedY = this.lastY - deltaY * 2;

      const lineThickness = 5; // Initial thickness of the line
      const taperSteps = 5; // Number of steps for tapering
      const taperFactor = 0.8;

      for (let i = 0; i < taperSteps; i++) {
        this.ctx.strokeStyle = `rgba(0, 0, 0, ${0.7 * (1 - i / taperSteps)})`; // Adjust opacity for fade
        this.ctx.lineWidth = lineThickness * Math.pow(taperFactor, i); // Gradually decrease line thickness

        this.ctx.beginPath();
        this.ctx.moveTo(
          extendedX + (deltaX * i) / taperSteps,
          extendedY + (deltaY * i) / taperSteps
        );
        this.ctx.lineTo(
          x + (deltaX * (i - taperSteps)) / taperSteps,
          y + (deltaY * (i - taperSteps)) / taperSteps
        );
        this.ctx.stroke();
      }
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
      this.explode(fruit);
      return;
    }

    const slicedImages = Board.slicedImagePaths(fruit.imagePath(), direction);
    // half one <-
    const imageSize =
      direction === SliceDirection.Horizontal
        ? new Size(FruitImageSize.width, FruitImageSize.height / 2)
        : new Size(FruitImageSize.width / 2, FruitImageSize.height);
    let velocityX =
      fruit.velocity.vx < 0 ? fruit.velocity.vx : -fruit.velocity.vx;
    let halfOne = new Fruit(
      new Point(fruit.position.x, fruit.position.y),
      new Velocity(velocityX, 0),
      slicedImages[0],
      imageSize,
      (fruit) => {
        this.fruits.push(fruit);
      }
    );
    halfOne.slice();
    // half two ->
    const positionX =
      imageSize.width == FruitImageSize.width
        ? fruit.position.x
        : fruit.position.x + imageSize.width;
    const positionY =
      imageSize.width == FruitImageSize.width
        ? fruit.position.y + imageSize.height
        : fruit.position.y;
    velocityX = Math.abs(fruit.velocity.vx);
    const halfTwo = new Fruit(
      new Point(positionX, positionY),
      new Velocity(velocityX, 0),
      slicedImages[1],
      imageSize,
      (fruit) => {
        this.fruits.push(fruit);
      }
    );
    halfTwo.slice();
    this.fruits.splice(this.fruits.indexOf(fruit), 1);
  }

  /**
   * @brief Explodes a bomb after slicing.
   *
   * Causes game over.
   *
   * @todo implement proper visualization.
   * @param bomb Bomb object that had been sliced.
   */
  explode(bomb) {
    clearInterval(this.fruitMoveIntervalId);
    alert("Game over!");
  }
}

let board = new Board();
board.generateRandomFruit();

function gameLoop() {
  board.drawElements();
  requestAnimationFrame(gameLoop);
}

gameLoop();

//const slider = document.getElementById("slider-input");
//const value = document.getElementById("slider-value");
//const audio = document.getElementById("audio");

//value.textContent = slider.value;
//audio.volume = slider.value / 100;

//slider.addEventListener("input", function() {
//    const volume = this.value / 100;
//    value.textContent = this.value;
//    audio.volume = volume;
//})
