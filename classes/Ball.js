//import { Vector } from './Vector.js';
const Vector = require('./Vector.js');

export default class Ball {
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
        this.up = false;
        this.right = false;
        this.down = false;
        this.SPACE = false;

        this.scored = 0;
        BALLZ.push(this);
    }
    drawBall() {
        ctx.beginPath();
        ctx.globalCompositeOperation = 'source-over';
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black';
        ctx.stroke();
        if (this.player) {
            if (this.left) ctx.fillStyle = 'salmon';
            else ctx.fillStyle = 'steelblue';
        } else ctx.fillStyle = 'silver';
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

    keyControl() {
        if (this.left) {
            this.acc.x = -this.acceleration;
        }
        if (this.up) {
            this.acc.y = -this.acceleration;
        }
        if (this.right) {
            this.acc.x = this.acceleration;
        }
        if (this.down) {
            this.acc.y = this.acceleration;
        }
        if (!this.left && !this.right) {
            this.acc.x = 0;
        }
        if (!this.up && !this.down) {
            this.acc.y = 0;
        }
        if (this.SPACE) {
            this.highlight();
        }
    }

    reposition() {
        let fr = this.player ? friction : ballFriction;
        this.acc = this.acc.unit().mult(this.acceleration);
        this.vel = this.vel.add(this.acc);
        this.vel = this.vel.mult(1 - fr);
        this.pos = this.pos.add(this.vel);
    }
}
