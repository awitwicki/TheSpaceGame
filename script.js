var ship;

var debugMode = false;
var meteors;
var battery;

function startGame() {
  myGameArea.start();
  initGameLevel();
}

function endGame() {
  alert("Game over!");

  // Reset game keyboard
  myGameArea.keys = [];
  initGameLevel();
}

// Create battery with random location
function initBattery() {
  var _speed_x = Math.random() * 1 - 0.5;
  var _speed_y = Math.random() * 1 - 0.5;

  var _width = Math.random() * myGameArea.canvas.width;
  var _height = Math.random() * myGameArea.canvas.height;

  battery = new component(50, 50, "res/battery.png", _width, _height, _speed_x, _speed_y, "battery");
}

function initGameLevel() {
  // Create meteors with random speed and location
  meteors = [];

  for (var i = 0; i < 50; i++) {
    var _speed_x = Math.random() * 1 - 0.5;
    var _speed_y = Math.random() * 1 - 0.5;

    var _width = Math.random() * myGameArea.canvas.width;
    var _height = Math.random() * myGameArea.canvas.height;
    var _meteor = new component(50, 50, "res/meteor.png", _width, _height, _speed_x, _speed_y, "meteor");
    meteors.push(_meteor);

    do {
      meteors[i].x = Math.random() * myGameArea.canvas.width;
      meteors[i].y = Math.random() * myGameArea.canvas.height;
    }
    while (findNearMeteor(i))
  }

  // Create player ship
  ship = new component(50, 50, "res/ship.png", 400, 400, 0, 0, "ship");

  ship.trust = 0;
  ship.trustCoefficient = 1;
  ship.energy = 1000;
  ship.angle = 0;
  ship.speedX = 0;
  ship.speedY = 0;
  ship.averageX = 0;
  ship.averageY = 0;

  do {
    ship.x = Math.random() * myGameArea.canvas.width;
    ship.y = Math.random() * myGameArea.canvas.height;
  }
  while (findNearMeteorAboveShip())

  // Create baterry
  initBattery();
}

var myGameArea = {
  canvas: document.createElement("canvas"),
  start: function () {
    document.body.innerWidth
    this.canvas.width = window.innerWidth - 2;
    this.canvas.height = window.innerHeight - 30;
    this.context = this.canvas.getContext("2d");

    document.body.insertBefore(this.canvas, document.body.childNodes[0]);

    this.interval = setInterval(updateGameArea, 20);
    window.addEventListener('keydown', function (e) {
      myGameArea.keys = (myGameArea.keys || []);
      myGameArea.keys[e.keyCode] = (e.type == "keydown");

      // Debug mode on/off
      if (e.keyCode == 72) {
        debugMode = !debugMode;
      }

      // Change ship image
      this.isAnyKeyPressed = true;
      ship.image.src = "res/ship_with_thrusters.png";
    })
    window.addEventListener('keyup', function (e) {
      myGameArea.keys[e.keyCode] = (e.type == "keydown");

      // Change ship image
      if (!(myGameArea.keys[37] || myGameArea.keys[38] || myGameArea.keys[39] || myGameArea.keys[40])) {
        ship.image.src = "res/ship.png";
      }
    })
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function component(width, height, color, x, y, speed_x, speed_y, type) {
  this.type = type;

  this.image = new Image();
  this.image.src = color;

  this.gamearea = myGameArea;
  this.width = width;
  this.height = height;
  this.angle = 0 * Math.PI / 180;
  this.trust = 0;
  this.trustCoefficient = 1;
  this.energy = 1000;
  this.level = 1;
  this.speedX = speed_x;
  this.speedY = speed_y;
  this.averageX = 0;
  this.averageY = 0;
  this.x = x;
  this.y = y;

  this.update = function () {
    ctx = myGameArea.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.drawImage(this.image, this.width / -2, this.height / -2, this.width, this.height);

    if (debugMode) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + (this.speedX * 100), this.y + (this.speedY * 100));
      ctx.strokeStyle = "#00FF00";
      ctx.stroke();
    }

    // Check collision with any meteors
    if (this.type == "ship") {
      var meteorCollision = findNearMeteorAboveShip();
      if (meteorCollision) {
        endGame();
      }
    }

    // Check ship collision with baterry
    if (this.type == "battery") {
      var distanceToShip = Math.sqrt(Math.pow(this.x - (ship.x), 2) + Math.pow(this.y - ship.y, 2));
      if (distanceToShip < 50) {
        initBattery();

        // Ship bonus
        if (ship.trustCoefficient < 5) {
          ship.trustCoefficient *= 1.1;
          ship.energy += 1000;
          ship.level += 1;
        }
      }
    }

    ctx.restore();
  }

  this.newPos = function () {
    this.averageX = Math.sin(this.angle) * this.trust * this.trustCoefficient;
    this.averageY = -Math.cos(this.angle) * this.trust * this.trustCoefficient;;
    this.speedX += this.averageX;
    this.speedY += this.averageY;

    if (this.y > myGameArea.canvas.height) {
      this.speedY = 0;
      this.y = myGameArea.canvas.height
    }
    if (this.x < 0) {
      this.speedX = 0;
      this.x = 0;
    }
    if (this.y < 0) {
      this.speedY = 0;
      this.y = 0;
    }
    if (this.x > myGameArea.canvas.width) {
      this.speedX = 0;
      this.x = myGameArea.canvas.width;
    }

    this.x += this.speedX;
    this.y += this.speedY;
  }

  this.newPosMeteor = function (meteorIndex) {
    // Collision with area
    if (this.y < 0 || this.y > this.gamearea.canvas.height) {
      this.speedY *= -1;
    }
    if (this.x < 0 || this.x > this.gamearea.canvas.width) {
      this.speedX *= -1;
    }

    // Find meteor with collision
    var _collisionMeteor = findNearMeteor(meteorIndex);

    // Change speed of meteor after collision with other meteors
    if (_collisionMeteor != null) {

      if (debugMode) {
        ctx = myGameArea.context;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(_collisionMeteor.x, _collisionMeteor.y);
        ctx.strokeStyle = "#FF0000";
        ctx.stroke();
      }

      // Collision by X
      if (this.speedX * _collisionMeteor.speedX < 0) {
        this.speedX *= -1;
        _collisionMeteor.speedX *= -1;
      }
      // Else swap speeds
      else {
        var speedX = this.speedX;
        this.speedX = _collisionMeteor.speedX;
        _collisionMeteor.speedX = speedX;
      }

      // Collision by Y
      if (this.speedY * _collisionMeteor.speedY < 0) {
        this.speedY *= -1;
        _collisionMeteor.speedY *= -1;
      }
      // Else swap speeds
      else {
        var speedY = this.speedY;
        this.speedY = _collisionMeteor.speedY;
        _collisionMeteor.speedY = speedY;
      }
    }

    this.x += this.speedX;
    this.y += this.speedY;
  }
}

// Collision with other meteors that nearest above 50 between each other
function findNearMeteor(meteorIndex) {
  for (var i = 0; i < meteors.length; i++) {
    if (i != meteorIndex) {
      var _distance = Math.sqrt(Math.pow(meteors[i].x - (meteors[meteorIndex].x), 2) + Math.pow(meteors[i].y - meteors[meteorIndex].y, 2));

      if (_distance < 45) {
        return meteors[i];
      }
    }
  }
  return null;
}

function findNearMeteorAboveShip() {
  for (var i = 0; i < meteors.length; i++) {
    var _distance = Math.sqrt(Math.pow(meteors[i].x - (ship.x), 2) + Math.pow(meteors[i].y - ship.y, 2));

    // Draw lines to nearby meteors
    if (debugMode && _distance < 300) {
      ctx = myGameArea.context;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      ctx.lineTo(meteors[i].x, meteors[i].y);
      ctx.strokeStyle = "#FF0000";
      ctx.stroke();
    }

    // Collision with meteor
    if (_distance < 45) {
      return true;
    }
  }
  return false;
}

// Update game tick
function updateGameArea() {
  myGameArea.clear();
  ship.trust = 0;
  ship.speedX *= 0.99;
  ship.speedY *= 0.99;

  // If any control key is pressed
  if (myGameArea.keys) {
    // Thruster left (idk maybe right)
    if (myGameArea.keys[37]) {
      ship.angle -= 3 * Math.PI / 180;
    }

    // Thruster right (idk maybe left)
    if (myGameArea.keys[39]) {
      ship.angle += 3 * Math.PI / 180;
    }

    // Thruster forward
    if (myGameArea.keys[38]) {
      ship.trust = 0.1;
    }

    // Thruster backward
    if (myGameArea.keys[40]) {
      ship.trust = -0.1;
    }
  }

  // Update player ship
  ship.newPos();
  ship.update();
  ship.energy -= 1;

  if (ship.energy < 0) {
    endGame();
  }

  // Update battery
  battery.update();
  battery.newPos();

  // Update meteors
  for (var i = 0; i < meteors.length; i++) {
    meteors[i].update();
    meteors[i].newPosMeteor(i);
  }

  // Draw ui
  ctx = myGameArea.context;
  ctx.font = "20px Arial";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Level: " + ship.level + ", Energy: " + ship.energy, 10, 30);
}
