const canvas = document.getElementById('canvas');
const elemScoreBoard = document.getElementById('scoreBoard');
const homeScoredElem = document.querySelector('.home');
const awayScoredElem = document.querySelector('.away');
const ctx = canvas.getContext('2d');

const BALLZ = [];
const WALLZ = [];
let LEFT, UP, RIGHT, DOWN, SPACE;
let friction = 0.05;
let ballFriction = 0.015;
let shootSpeed = 5;
let leftScore = 0;
let rightScore = 0;
let pauseGame = false;
const GOAL_SIZE = 200;
const GOAL_DEPTH = 60;
const GOAL_POST_LEFT_X1 = GOAL_DEPTH;
const GOAL_POST_LEFT_Y1 = canvas.clientHeight / 2 - GOAL_SIZE / 2;
const GOAL_POST_LEFT_X2 = GOAL_DEPTH;
const GOAL_POST_LEFT_Y2 = GOAL_POST_LEFT_Y1 + GOAL_SIZE;
const GOAL_POST_RIGHT_X1 = canvas.clientWidth - GOAL_DEPTH;
const GOAL_POST_RIGHT_Y1 = GOAL_POST_LEFT_Y1;
const GOAL_POST_RIGHT_X2 = GOAL_POST_RIGHT_X1;
const GOAL_POST_RIGHT_Y2 = GOAL_POST_LEFT_Y1 + GOAL_SIZE;
let IsLeftScored = false;
let IsRightScored = false;
let counter5sec = 0;

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    subtr(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    mult(n) {
        return new Vector(this.x * n, this.y * n);
    }
    normal() {
        return new Vector(-this.y, this.x).unit();
    }
    unit() {
        if (this.mag() === 0) {
            return new Vector(0, 0);
        } else {
            return new Vector(this.x / this.mag(), this.y / this.mag());
        }
    }
    drawVec(start_x, start_y, n, color) {
        ctx.beginPath();
        ctx.moveTo(start_x, start_y);
        ctx.lineTo(start_x + this.x * n, start_y + this.y * n);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    }
    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    static cross(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x;
    }
}

class Ball {
    constructor(x, y, r, m) {
        this.pos = new Vector(x, y);
        this.r = r;
        this.m = m;
        if (this.m === 0) {
            this.inv_m = 0;
        } else {
            this.inv_m = 1 / this.m;
        }
        this.elasticity = 1;
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.acceleration = 0.4;
        this.player = false;
        this.left = false;
        this.scored = 0;
        BALLZ.push(this);
    }

    drawBall() {
        ctx.beginPath();
        ctx.globalCompositeOperation = 'source-over';
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = 'black';
        ctx.stroke();

        if (this.player) {
            if (this.left) {
                ctx.fillStyle = 'salmon';
            } else {
                ctx.fillStyle = 'steelblue';
            }
        } else {
            ctx.fillStyle = 'silver';
        }

        ctx.fill();
        ctx.closePath();
    }

    setScore(score) {
        this.scored = score;
    }

    highlight() {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'white';
        ctx.stroke();
        ctx.fillStyle = 'darksalmon';
        ctx.fill();
        ctx.closePath();
    }

    display() {
        if (this.scored > 0) {
            //console.log("skor: " + this.scored);
            ctx.fillStyle = 'green';
            ctx.font = '20px serif';
            ctx.fillText(this.scored, this.pos.x - 5, this.pos.y + 5);
        }
        //this.vel.drawVec(this.pos.x, this.pos.y, 10, "green");
        // ctx.fillStyle = "black";
        // ctx.fillText("m = "+this.m, this.pos.x-10, this.pos.y-5);
        // ctx.fillText("e = "+this.elasticity, this.pos.x-10, this.pos.y+5);
    }

    setPosition(x, y) {
        this.pos.set(x, y);
    }

    reposition() {
        let fr = this.player ? friction : ballFriction;
        this.acc = this.acc.unit().mult(this.acceleration);
        this.vel = this.vel.add(this.acc);
        this.vel = this.vel.mult(1 - fr);
        this.pos = this.pos.add(this.vel);
    }
}

//Walls are line segments between two points
class Wall {
    constructor(x1, y1, x2, y2) {
        this.start = new Vector(x1, y1);
        this.end = new Vector(x2, y2);
        this.goal = '';
        this.IsPitchLine = false;
        WALLZ.push(this);
    }
    drawWall() {
        ctx.beginPath();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        if (this.IsPitchLine) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'lightgray';
        } else {
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'white';
        }
        ctx.stroke();
        ctx.closePath();
    }
    wallUnit() {
        return this.end.subtr(this.start).unit();
    }
    highlight() {
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = 'green';
        ctx.stroke();
        ctx.closePath();
    }
}
function keyControl(b) {
    canvas.addEventListener('keydown', function (e) {
        if (e.keyCode === 37) {
            LEFT = true;
        }
        if (e.keyCode === 38) {
            UP = true;
        }
        if (e.keyCode === 39) {
            RIGHT = true;
        }
        if (e.keyCode === 40) {
            DOWN = true;
        }
        if (e.keyCode === 32) {
            SPACE = true;
        }
    });
    canvas.addEventListener('keyup', function (e) {
        if (e.keyCode === 37) {
            LEFT = false;
        }
        if (e.keyCode === 38) {
            UP = false;
        }
        if (e.keyCode === 39) {
            RIGHT = false;
        }
        if (e.keyCode === 40) {
            DOWN = false;
        }
        if (e.keyCode === 32) {
            SPACE = false;
        }
    });

    // canvas.addEventListener('touchstart', evt => {
    //     evt.preventDefault();
    //     const touches = evt.changedTouches;

    //     for (let i = 0; i < touches.length; i++) {
    //         const px = touches[i].pageX;
    //         const py = touches[i].pageY;
    //         const pt = [px, py];
    //         ongoingTouches.add(pt);
    //     }

    //     const touchesArr = [...ongoingTouches];

    //     console.log(touchesArr.at(-1));

    //     LEFT = b.x - touchesArr.at(-1).pageX > 0;
    //     RIGHT = b.x - touchesArr.at(-1).pageX < 0;
    //     UP = b.y - touchesArr.at(-1).pageY > 0;
    //     DOWN = b.y - touchesArr.at(-1).pageY < 0;

    //     console.log(LEFT, RIGHT, UP, DOWN);

    //     //console.log([...ongoingTouches]);
    // });

    // canvas.addEventListener('touchend', evt => {
    //     evt.preventDefault();
    //     // LEFT = RIGHT = UP = DOWN = SPACE = false;
    // });

    if (LEFT) {
        b.acc.x = -b.acceleration;
    }
    if (UP) {
        b.acc.y = -b.acceleration;
    }
    if (RIGHT) {
        b.acc.x = b.acceleration;
    }
    if (DOWN) {
        b.acc.y = b.acceleration;
    }
    if (!LEFT && !RIGHT) {
        b.acc.x = 0;
    }
    if (!UP && !DOWN) {
        b.acc.y = 0;
    }
    if (SPACE) {
        b.highlight();
    }
}

function round(number, precision) {
    let factor = 10 ** precision;
    return Math.round(number * factor) / factor;
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//returns with the closest point on a line segment to a given point
function closestPointBW(b1, w1) {
    let ballToWallStart = w1.start.subtr(b1.pos);
    if (Vector.dot(w1.wallUnit(), ballToWallStart) > 0) {
        return w1.start;
    }
    let wallEndToBall = b1.pos.subtr(w1.end);
    if (Vector.dot(w1.wallUnit(), wallEndToBall) > 0) {
        return w1.end;
    }
    let closestDist = Vector.dot(w1.wallUnit(), ballToWallStart);
    let closestVect = w1.wallUnit().mult(closestDist);
    return w1.start.subtr(closestVect);
}
function coll_det_bb(b1, b2) {
    if (b1.r + b2.r >= b2.pos.subtr(b1.pos).mag()) {
        return true;
    } else {
        return false;
    }
}
//collision detection between ball and wall
function coll_det_bw(b1, w1) {
    let ballToClosest = closestPointBW(b1, w1).subtr(b1.pos);
    if (ballToClosest.mag() <= b1.r) {
        return true;
    }
}
function pen_res_bb(b1, b2) {
    ballFriction = 0.07;
    let dist = b1.pos.subtr(b2.pos);
    let pen_depth = b1.r + b2.r - dist.mag();
    let pen_res = dist.unit().mult(pen_depth / (b1.inv_m + b2.inv_m));
    b1.pos = b1.pos.add(pen_res.mult(b1.inv_m));
    b2.pos = b2.pos.add(pen_res.mult(-b2.inv_m));
}
//penetration resolution between ball and wall
function pen_res_bw(b1, w1) {
    let penVect = b1.pos.subtr(closestPointBW(b1, w1));
    let penVectMult = penVect.unit().mult(b1.r - penVect.mag());
    b1.pos = b1.pos.add(penVectMult);
    if (b1.pos.x < 0) {
        b1.pos.x = Math.abs(b1.pos.x);
    }
    if (b1.pos.y < 0) {
        b1.pos.y = Math.abs(b1.pos.y);
    }
    if (b1.pos.x > canvas.clientWidth) {
        b1.pos.x = canvas.clientWidth - Math.abs(canvas.clientWidth - b1.pos.x);
    }
    if (b1.pos.y > canvas.clientHeight) {
        b1.pos.y =
            canvas.clientHeight - Math.abs(canvas.clientHeight - b1.pos.y);
    }
}
function coll_res_bb(b1, b2) {
    let normal = b1.pos.subtr(b2.pos).unit();
    let relVel = b1.vel.subtr(b2.vel);
    let sepVel = Vector.dot(relVel, normal);
    let new_sepVel = -sepVel * Math.min(b1.elasticity, b2.elasticity);
    let vsep_diff = new_sepVel - sepVel;
    let impulse = vsep_diff / (b1.inv_m + b2.inv_m);
    let impulseVec = normal.mult(impulse);
    b1.vel = b1.vel.add(impulseVec.mult(b1.inv_m));
    b2.vel = b2.vel.add(impulseVec.mult(-b2.inv_m));
}
function hit_res_bb(b1, b2) {
    ballFriction = 0.015;
    let normal = b1.pos.subtr(b2.pos).unit();
    let relVel = b1.vel.subtr(b2.vel.unit());
    let sepVel = Vector.dot(relVel, normal);
    let new_sepVel = -sepVel * Math.min(b1.elasticity, b2.elasticity);
    let vsep_diff = new_sepVel - sepVel;
    let impulse = (shootSpeed * vsep_diff) / b2.inv_m;
    let impulseVec = normal.mult(impulse);
    //b1.vel = b1.vel.add(impulseVec.mult(b1.inv_m));
    b2.vel = b2.vel.add(impulseVec.mult(-b2.inv_m));
    SPACE = false;
    SPACE_2 = false;
}
//collision response between ball and wall
function coll_res_bw(b1, w1) {
    let normal = b1.pos.subtr(closestPointBW(b1, w1)).unit();
    let sepVel = Vector.dot(b1.vel, normal);
    let new_sepVel = -sepVel * b1.elasticity;
    let vsep_diff = sepVel - new_sepVel;
    b1.vel = b1.vel.add(normal.mult(-vsep_diff));
}
function momentum_display() {
    let momentum = Ball1.vel.add(Ball2.vel).mag();
    ctx.fillText('Momentum: ' + round(momentum, 4), 500, 330);
}
function updateScoreBoard() {
    // elemScoreBoard.style.backgroundColor = 'rgb(116,133,99)';

    homeScoredElem.textContent = leftScore;
    awayScoredElem.textContent = rightScore;
    elemScoreBoard.innerText = leftScore + ' - ' + rightScore;
}
function drawPitchLines() {
    ctx.beginPath();
    ctx.globalCompositeOperation = 'source-over';
    ctx.arc(
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
        100,
        0,
        2 * Math.PI
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'lightgray';
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(canvas.clientWidth / 2, 0);
    ctx.lineTo(canvas.clientWidth / 2, canvas.clientHeight);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'lightgray';
    ctx.stroke();
    ctx.closePath();
}

function mainLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    ballFriction = 0.015;

    GoalPostR1.drawBall();
    GoalPostR2.drawBall();
    GoalPostL1.drawBall();
    GoalPostL2.drawBall();

    drawPitchLines();
    ballB.drawBall();
    ballP1.drawBall();
    ballP2.drawBall();

    keyControl(ballP1);

    // P1 and ball
    if (coll_det_bb(ballP1, ballB)) {
        pen_res_bb(ballP1, ballB);
        if (!SPACE) {
            coll_res_bb(ballP1, ballB);
        } else {
            var audio = new Audio('./src/soccer-kick.mp3');
            audio.play();
            hit_res_bb(ballP1, ballB);
        }
    }
    // P2 and ball
    if (coll_det_bb(ballP2, ballB)) {
        pen_res_bb(ballP2, ballB);
        if (!SPACE_2) {
            coll_res_bb(ballP2, ballB);
        } else {
            var audio = new Audio('./src/soccer-kick.mp3');
            audio.play();
            hit_res_bb(ballP2, ballB);
        }
    }

    // P1 and P2
    if (coll_det_bb(ballP1, ballP2)) {
        pen_res_bb(ballP1, ballP2);
        if (!SPACE) {
            coll_res_bb(ballP1, ballP2);
        } else {
            var audio = new Audio('./src/player-kick.wav');
            audio.play();
            hit_res_bb(ballP1, ballP2);
        }
    }

    WALLZ.forEach(w => {
        // Walls and ball
        if (coll_det_bw(ballB, w)) {
            if (!w.IsPitchLine) {
                pen_res_bw(ballB, w);
                coll_res_bw(ballB, w);
            }
            if (w.goal == 'R') {
                if (!IsLeftScored && elemScoreBoard.innerText != 'GOOOL!') {
                    leftScore++;
                    IsLeftScored = true;
                    var audio = new Audio('./src/goal.wav');
                    audio.play();
                    var audio2 = new Audio('./src/crowd.wav');
                    audio2.play();
                }
                ballP1.setScore(leftScore);
            } else if (w.goal == 'L') {
                if (!IsRightScored && elemScoreBoard.innerText != 'GOOOL!') {
                    rightScore++;
                    IsRightScored = true;
                    var audio = new Audio('./src/goal.wav');
                    audio.play();
                    var audio2 = new Audio('./src/crowd.wav');
                    audio2.play();
                }
                ballP2.setScore(rightScore);
            }
        }
        // Walls and P1
        if (coll_det_bw(ballP1, w)) {
            pen_res_bw(ballP1, w);
            coll_res_bw(ballP1, w);
        }
        // Walls and P2
        if (coll_det_bw(ballP2, w)) {
            pen_res_bw(ballP2, w);
            coll_res_bw(ballP2, w);
        }
    });
    // Goal posts and ball
    setCollisionResponseBB(ballB, GoalPostL1);
    setCollisionResponseBB(ballB, GoalPostL2);
    setCollisionResponseBB(ballB, GoalPostR1);
    setCollisionResponseBB(ballB, GoalPostR2);
    ballB.reposition();
    ballP1.reposition();
    ballP2.reposition();
    //drawing each wall on the canvas
    WALLZ.forEach(w => {
        w.drawWall();
    });
    if (IsLeftScored || IsRightScored) {
        pauseGame = true;
        displayScore();

        setTimeout(resetFlags, 2000);
        requestAnimationFrame(mainLoop);
    } else {
        requestAnimationFrame(mainLoop);
        updateScoreBoard();
    }
}
function setCollisionResponseBB(b, g) {
    // Walls and P2
    if (coll_det_bb(b, g)) {
        var audio = new Audio('./src/goal-post.wav');
        audio.play();
        pen_res_bb(b, g);
        coll_res_bb(b, g);
    }
}
function resetFlags() {
    IsLeftScored = false;
    IsRightScored = false;
    ballP1.pos = new Vector(GOAL_SIZE, canvas.clientHeight / 2);
    ballP1.vel = new Vector(0, 0);
    ballP1.acc = new Vector(0, 0);
    ballP1.acceleration = 0.4;
    ballP2.pos = new Vector(
        canvas.clientWidth - GOAL_SIZE,
        canvas.clientHeight / 2
    );
    ballP2.vel = new Vector(0, 0);
    ballP2.acc = new Vector(0, 0);
    ballP2.acceleration = 0.4;
    ballB.pos = new Vector(canvas.clientWidth / 2, canvas.clientHeight / 2);
    ballB.vel = new Vector(0, 0);
    ballB.acc = new Vector(0, 0);
    ballB.acceleration = 0.4;
    pauseGame = false;
}
function displayScore() {
    elemScoreBoard.style.backgroundColor = IsLeftScored
        ? 'salmon'
        : 'steelBlue';
    elemScoreBoard.innerText = 'GOOOL!';
}

let ballP1 = new Ball(GOAL_SIZE, canvas.clientHeight / 2, 36, 10);
let ballP2 = new Ball(
    canvas.clientWidth - GOAL_SIZE,
    canvas.clientHeight / 2,
    36,
    10
);
let ballB = new Ball(canvas.clientWidth / 2, canvas.clientHeight / 2, 24, 1);
ballP1.player = true;
ballP2.player = true;
ballP1.elasticity = 0.1;
ballP2.elasticity = 0.1;
ballB.elasticity = 0.5;
ballP1.left = true;
// Goal walls
let GoalL = new Wall(5, GOAL_POST_RIGHT_Y1, 5, GOAL_POST_RIGHT_Y2);
let GoalR = new Wall(
    canvas.clientWidth - 5,
    GOAL_POST_RIGHT_Y1,
    canvas.clientWidth - 5,
    GOAL_POST_RIGHT_Y2
);
let SideLeft3 = new Wall(
    0,
    GOAL_POST_RIGHT_Y1,
    GOAL_POST_LEFT_X1,
    GOAL_POST_RIGHT_Y1
);
let SideLeft4 = new Wall(
    0,
    GOAL_POST_RIGHT_Y2,
    GOAL_POST_LEFT_X1,
    GOAL_POST_RIGHT_Y2
);
let pLineGoalLeft = new Wall(
    GOAL_POST_LEFT_X1,
    GOAL_POST_RIGHT_Y1 + 5,
    GOAL_POST_LEFT_X1,
    GOAL_POST_RIGHT_Y2 - 5
);
pLineGoalLeft.IsPitchLine = true;
let GoalPostL1 = new Ball(GOAL_POST_LEFT_X1, GOAL_POST_LEFT_Y1, 10, 0);
let GoalPostL2 = new Ball(GOAL_POST_LEFT_X2, GOAL_POST_LEFT_Y2, 10, 0);
GoalPostL1.elasticity = 1;
GoalPostL2.elasticity = 1;
let SideRight3 = new Wall(
    canvas.clientWidth - 4,
    GOAL_POST_RIGHT_Y1,
    GOAL_POST_RIGHT_X1,
    GOAL_POST_RIGHT_Y1
);
let SideRight4 = new Wall(
    canvas.clientWidth - 4,
    GOAL_POST_RIGHT_Y2,
    GOAL_POST_RIGHT_X1,
    GOAL_POST_RIGHT_Y2
);
let pLineGoalRight = new Wall(
    GOAL_POST_RIGHT_X1,
    GOAL_POST_RIGHT_Y1 + 5,
    GOAL_POST_RIGHT_X1,
    GOAL_POST_RIGHT_Y2 - 5
);
pLineGoalRight.IsPitchLine = true;
let GoalPostR1 = new Ball(GOAL_POST_RIGHT_X1, GOAL_POST_RIGHT_Y1, 10, 0);
let GoalPostR2 = new Ball(GOAL_POST_RIGHT_X2, GOAL_POST_RIGHT_Y2, 10, 0);
GoalPostR1.elasticity = 1;
GoalPostR2.elasticity = 1;
let Corner1 = new Wall(0, 25, 25, 0);
let Corner2 = new Wall(0, canvas.clientHeight - 25, 25, canvas.clientHeight);
let Corner3 = new Wall(
    canvas.clientWidth - 25,
    canvas.clientHeight,
    canvas.clientWidth,
    canvas.clientHeight - 25
);
let Corner4 = new Wall(canvas.clientWidth - 25, 0, canvas.clientWidth, 25);
let CornerL1 = new Wall(
    0,
    GOAL_POST_LEFT_Y1 - 25,
    GOAL_POST_LEFT_X1,
    GOAL_POST_LEFT_Y1
);
let CornerL2 = new Wall(
    0,
    GOAL_POST_LEFT_Y2 + 25,
    GOAL_POST_LEFT_X2,
    GOAL_POST_LEFT_Y2
);
let CornerR1 = new Wall(
    canvas.clientWidth,
    GOAL_POST_RIGHT_Y1 - 25,
    GOAL_POST_RIGHT_X1,
    GOAL_POST_RIGHT_Y1
);
let CornerR2 = new Wall(
    canvas.clientWidth,
    GOAL_POST_RIGHT_Y2 + 25,
    GOAL_POST_RIGHT_X2,
    GOAL_POST_RIGHT_Y2
);
GoalL.goal = 'L';
GoalR.goal = 'R';
//walls along the canvas edges
let edge1 = new Wall(0, 0, canvas.clientWidth, 0);
let edge2 = new Wall(
    canvas.clientWidth,
    0,
    canvas.clientWidth,
    canvas.clientHeight
);
let edge3 = new Wall(
    canvas.clientWidth,
    canvas.clientHeight,
    0,
    canvas.clientHeight
);
let edge4 = new Wall(0, canvas.clientHeight, 0, 0);

// touch events for mobile
const ongoingTouches = new Set();

function copyTouch({ identifier, pageX, pageY }) {
    return { identifier, pageX, pageY };
}

requestAnimationFrame(mainLoop);
