import GameScreen from '../GameScreen';
import Player from '../Player';
import type Renderer from '../Renderer';
import Wall from '../objects/Wall';

export default class InGame extends GameScreen {
    #player: Player;
    #walls: Wall[];

    constructor() {
        super();

        this.#player = new Player();
        this.#walls = [
            new Wall(30, 15, 30, 600),
            new Wall(230, 50, 30, 600),
        ];
    }

    #fps = 0;
    update(deltaTime: number): void {
        this.#fps = 1000 / deltaTime;
    }

    render(renderer: Renderer): void {
        renderer.beginFrame();
        renderer.renderTest();
        this.#walls.forEach(renderer.render.bind(renderer));

        renderer.renderFps(this.#fps);
    }
}
