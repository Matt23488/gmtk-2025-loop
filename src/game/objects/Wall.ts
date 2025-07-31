import type { Renderable } from '../Renderer';

export default class Wall implements Renderable {
    #x: number;
    #y: number;
    #w: number;
    #h: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.#x = x;
        this.#y = y;
        this.#w = w;
        this.#h = h;
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.#x, this.#y, this.#w, this.#h);
    }
}
