//import { Vector } from './Vector.js';
const Vector = require('./Vector.js');

//Walls are line segments between two points
export default class Wall {
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
