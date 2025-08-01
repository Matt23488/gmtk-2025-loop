import Camera from '../Camera';
import GameScreen from '../GameScreen';
import type Input from '../Input';
import Level from '../Level';
import type Renderer from '../Renderer';
import MainMenu from './MainMenu';

export default class InGame extends GameScreen {
    #currentLevel: Level;
    #camera: Camera;

    constructor(container: HTMLElement) {
        super(container);
        
        this.#currentLevel = new Level(0);
        this.#camera = new Camera(this.#currentLevel);
    }

    #fps = 0;
    update(deltaTime: number, input: Input): void {
        this.#fps = 1 / deltaTime;

        this.#currentLevel.update(deltaTime, input);
        this.#currentLevel.centerCameraAtPlayer(this.#camera);

        if (this.#currentLevel.playerHasReachedGoal) {
            if (this.#currentLevel.hasNextLevel)
                this.#transitionLevel(this.#currentLevel.nextLevel);
            else
                this.transitionTo(new MainMenu(this.container))
        }
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

    #transitionLevel(levelNum: number) {
        this.#currentLevel = new Level(levelNum);
        this.#camera = new Camera(this.#currentLevel);
    }
}
