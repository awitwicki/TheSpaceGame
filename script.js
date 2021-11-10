
var myGamePiece;

var meteors;

function startGame() {
    myGameArea.start();
    myGamePiece = new component(50, 50, "res/ship.png", 400, 400, "image");
    meteors = [new component(50, 50, "res/meteor.png", 200, 200, "image"), new component(50, 50, "res/meteor.png", 500, 500, "image")];
}

var myGameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = 1800;
        this.canvas.height = 900;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(updateGameArea, 20);
        window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        })
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function component(width, height, color, x, y, type) {
    this.type = type;
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.gamearea = myGameArea;
    this.width = width;
    this.height = height;
    this.angle = 0 * Math.PI / 180;
    this.trust = 0;
    this.speedX = 0;
    this.speedY = 0;
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
        ctx.restore();
    }
    this.newPos = function () {
        this.averageX = Math.sin(this.angle) * this.trust;
        this.averageY = -Math.cos(this.angle) * this.trust;
        this.speedX += this.averageX;
        this.speedY += this.averageY;

        if (this.y > this.gamearea.canvas.height) {
            this.speedY = 0;
            this.y = this.gamearea.canvas.height
        }
        if (this.x < 0) {
            this.speedX = 0;
            this.x = 0;
        }
        if (this.y < 0) {
            this.speedY = 0;
            this.y = 0;
        }
        if (this.x > this.gamearea.canvas.width) {
            this.speedX = 0;
            this.x = this.gamearea.canvas.width;
        }

        this.x += this.speedX;
        this.y += this.speedY;
    }
}

function updateGameArea() {
    myGameArea.clear();
    myGamePiece.speedX *= 0.99;
    myGamePiece.speedY *= 0.99;
    myGamePiece.trust = 0;
    if (myGameArea.keys && myGameArea.keys[37]) { myGamePiece.angle -= 3 * Math.PI / 180; }
    if (myGameArea.keys && myGameArea.keys[39]) { myGamePiece.angle += 3 * Math.PI / 180; }
    if (myGameArea.keys && myGameArea.keys[38]) { myGamePiece.trust = 0.1; }
    if (myGameArea.keys && myGameArea.keys[40]) { myGamePiece.trust = -0.1; }
    myGamePiece.newPos();
    myGamePiece.update();
    meteors[0].newPos();
    meteors[0].update();
    meteors[1].newPos();
    meteors[1].update();
    // for (var meteor in meteors) { meteor.newPos(); }
    // for (var meteor in meteors) { meteor.update(); }
}
