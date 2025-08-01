import Camera, { WorldSpaceCoordinate } from '../Camera';
import GameScreen from '../GameScreen';
import type Input from '../Input';
import Level from '../Level';
import Player from '../Player';
import type Renderer from '../Renderer';

export default class InGame extends GameScreen {
    #currentLevelNum: number;
    #currentLevel: Level;
    #camera: Camera;
    #player: Player;

    constructor() {
        super();
        
        this.#currentLevelNum = 0;
        this.#currentLevel = new Level(0);
        this.#camera = new Camera(this.#currentLevel);
        this.#player = new Player(this.#currentLevel);
    }

    #fps = 0;
    update(deltaTime: number, input: Input): void {
        this.#fps = 1000 / deltaTime;

        const deltaSeconds = deltaTime / 1000;
        const playerMovementAmount = 10 * deltaSeconds;

        if (input.leftPressed)
            this.#player.moveLeft(WorldSpaceCoordinate.from(playerMovementAmount));

        if (input.rightPressed)
            this.#player.moveRight(WorldSpaceCoordinate.from(playerMovementAmount));

        this.#camera.centerAt(this.#player.position[0]);
    }

    render(renderer: Renderer): void {
        renderer.camera = this.#camera;

        if (this.#currentLevel.status === 'loaded') {
            this.#currentLevel.render(renderer);
            this.#player.render(renderer);
        } else
            renderer.renderText(
                this.#camera.center,
                this.#currentLevel.status,
                '30px sans-serif',
                'center',
                'middle',
                {
                    passes: [
                        {
                            type: 'fill',
                            style: 'white',
                        },
                    ],
                }
            );

        renderer.renderFps(this.#fps);
    }

    #transitionLevel() {
        this.#currentLevel = new Level(this.#currentLevelNum);
        this.#camera = new Camera(this.#currentLevel);
        this.#player = new Player(this.#currentLevel);
    }
}
