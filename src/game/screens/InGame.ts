import Camera, { WorldSpaceCoordinate } from '../Camera';
import GameScreen from '../GameScreen';
import type Input from '../Input';
import Level from '../Level';
import Player from '../Player';
import type Renderer from '../Renderer';

export default class InGame extends GameScreen {
    #player: Player;
    #currentLevelNum: number;
    #currentLevel: Level;
    #camera: Camera;

    constructor() {
        super();

        this.#player = new Player();

        this.#currentLevelNum = 0;
        this.#currentLevel = new Level(0);
        this.#camera = new Camera(this.#currentLevel);
    }

    #fps = 0;
    update(deltaTime: number, input: Input): void {
        this.#fps = 1000 / deltaTime;

        const deltaSeconds = deltaTime / 1000;
        const cameraMovementAmount = 3 * deltaSeconds; // 3 blocks per second

        if (input.leftPressed)
            this.#camera.moveLeft(WorldSpaceCoordinate.from(cameraMovementAmount));

        if (input.rightPressed)
            this.#camera.moveRight(WorldSpaceCoordinate.from(cameraMovementAmount));
    }

    render(renderer: Renderer): void {
        renderer.camera = this.#camera;

        if (this.#currentLevel.status === 'loaded') {
            this.#currentLevel.render(renderer);
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
    }
}
