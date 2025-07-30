import { Player } from './player';
import { Renderer } from './renderer';
import { Wall } from './wall';

export class Game {
    #renderer: Renderer;
    #player: Player;
    #walls: Wall[];

    constructor(container: HTMLDivElement) {
        this.#renderer = new Renderer(container);
        this.#player = new Player();
        this.#walls = [
            new Wall(30, 50, 30, 600),
            new Wall(230, 50, 30, 600),
        ];
    }

    start() {
        requestAnimationFrame(this.#loop.bind(this));
    }

    #lastFrameTime = 0;
    #loop(totalTime: number) {
        const deltaTime = totalTime - this.#lastFrameTime;
        this.#lastFrameTime = totalTime;

        this.#update(deltaTime);
        this.#render();

        requestAnimationFrame(this.#loop.bind(this));
    }

    #fps = 0;
    #update(deltaTime: number) {
        this.#fps = 1000 / deltaTime;
    }

    #render() {
        this.#renderer.beginFrame();
        this.#renderer.renderTest(this.#fps);
        this.#walls.forEach(this.#renderer.render.bind(this.#renderer));
    }
}
