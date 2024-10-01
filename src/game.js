// Configuration object for the Phaser game
var config = {
  type: Phaser.AUTO, // Use WebGL if available, otherwise fallback to Canvas
  width: 800, // Game width
  height: 600, // Game height
  physics: {
    default: "arcade", // Use the arcade physics engine
    arcade: {
      gravity: { y: 300 }, // Gravity applied to the Y-axis
      debug: false, // Set to true for debugging physics bodies
    },
  },
  scene: {
    preload: preload, // Preload assets
    create: create, // Create the game objects
    update: update, // Update game logic on each frame
  },
};

// Create a new Phaser game instance
var game = new Phaser.Game(config);

// Preload assets used in the game
function preload() {
  this.load.image("sky", "../assets/sky.png"); // Load sky background
  this.load.image("ground", "../assets/platform.png"); // Load ground platform
  this.load.image("star", "../assets/star.png"); // Load star image
  this.load.image("bomb", "../assets/bomb.png"); // Load bomb image
  this.load.spritesheet("dude", "assets/dude.png", {
    frameWidth: 32, // Width of each frame in the sprite sheet
    frameHeight: 48, // Height of each frame in the sprite sheet
  });
}

// Create game objects and set up the game
function create() {
  // Add sky background image
  this.add.image(400, 300, "sky");

  // Create a static group for platforms
  platforms = this.physics.add.staticGroup();

  // Create ground platforms
  platforms.create(400, 586, "ground").setScale(2).refreshBody(); // Main ground
  platforms.create(600, 400, "ground"); // Mid-level platform
  platforms.create(50, 250, "ground"); // Left platform
  platforms.create(750, 220, "ground"); // Right platform

  // Create player sprite
  player = this.physics.add.sprite(100, 450, "dude");

  // Set player properties
  player.setBounce(0.2); // Allow the player to bounce
  player.setCollideWorldBounds(true); // Prevent player from leaving the world
  this.physics.add.collider(player, platforms); // Collide player with platforms

  // Create animations for the player
  this.anims.create({
    key: "left", // Animation key
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }), // Frames for left animation
    frameRate: 10, // Frames per second
    repeat: -1, // Loop the animation
  });

  this.anims.create({
    key: "turn", // Animation key for idle state
    frames: [{ key: "dude", frame: 4 }], // Single frame for idle animation
    frameRate: 20, // Frames per second
  });

  this.anims.create({
    key: "right", // Animation key for moving right
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }), // Frames for right animation
    frameRate: 10, // Frames per second
    repeat: -1, // Loop the animation
  });

  // Create a group of stars
  stars = this.physics.add.group({
    key: "star", // Image key for stars
    repeat: 11, // Create 12 stars in total
    setXY: { x: 12, y: 0, stepX: 70 }, // Positioning stars in a row
  });

  // Set bounce effect for each star
  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // Random bounce for stars
  });

  // Enable collision and overlap for stars
  this.physics.add.collider(stars, platforms); // Collide stars with platforms
  this.physics.add.overlap(player, stars, collectStar, null, this); // Overlap check with player

  // Function to collect stars
  function collectStar(player, star) {
    star.disableBody(true, true); // Disable the collected star

    score += 10; // Increase score
    scoreText.setText("Score: " + score); // Update score text

    // Check if all stars are collected
    if (stars.countActive(true) === 0) {
      // Enable stars again for next round
      stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true); // Re-enable stars
      });

      // Spawn a bomb randomly on the screen
      var x =
        player.x < 400
          ? Phaser.Math.Between(400, 800) // Spawn on the right half of the screen
          : Phaser.Math.Between(0, 400); // Spawn on the left half of the screen

      var bomb = bombs.create(x, 16, "bomb"); // Create a new bomb
      bomb.setBounce(1); // Make the bomb bounce
      bomb.setCollideWorldBounds(true); // Prevent bomb from leaving the world
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20); // Set initial velocity
    }
  }

  // Initialize score variable and text
  var score = 0; // Start score at 0
  var scoreText;

  // Create score text display
  scoreText = this.add.text(16, 16, "score: 0", {
    fontSize: "32px", // Font size
    fill: "#000", // Font color
  });

  // Create a group for bombs
  bombs = this.physics.add.group();

  // Enable collision for bombs
  this.physics.add.collider(bombs, platforms); // Bombs collide with platforms

  // Enable collision for player and bombs
  this.physics.add.collider(player, bombs, hitBomb, null, this);

  // Function to handle player-bomb collision
  function hitBomb(player, bomb) {
    this.physics.pause(); // Pause the physics engine

    player.setTint(0xff0000); // Change player color to red

    player.anims.play("turn"); // Play idle animation

    gameOver = true; // Set game over flag to true

    // Get center coordinates of the camera
    const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const centerY =
      this.cameras.main.worldView.y + this.cameras.main.height / 2;

    // Define button style for the retry button
    let buttonStyle = {
      font: "32px Arial", // Font style
      fill: "#ffffff", // Text color
      backgroundColor: "#1c1c1c", // Dark background for the button
      padding: { x: 20, y: 10 }, // Padding around the text
      borderRadius: 5, // Optional: Rounded corners (only visual in this example)
    };

    // Create the retry button
    let retryButton = this.add
      .text(centerX, centerY, "Retry", buttonStyle) // Add text with defined style
      .setInteractive() // Make it interactive
      .on("pointerdown", () => {
        // Restart the game or scene when clicked
        this.scene.restart();
      });
  }
}

// Update function to handle player input and game state
function update() {
  // Create cursor keys for player movement
  cursors = this.input.keyboard.createCursorKeys();

  // Check for left arrow key input
  if (cursors.left.isDown) {
    player.setVelocityX(-160); // Move player left
    player.anims.play("left", true); // Play left animation
  } else if (cursors.right.isDown) {
    player.setVelocityX(160); // Move player right
    player.anims.play("right", true); // Play right animation
  } else {
    player.setVelocityX(0); // Stop horizontal movement
    player.anims.play("turn"); // Play idle animation
  }

  // Check for up arrow key input for jumping
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330); // Apply upward velocity for jump
  }
}
