import Camera from '../Camera';
import GameScreen from '../GameScreen';
import type { KeyState } from '../Input';
import type Input from '../Input';
import Level from '../Level';
import type Renderer from '../Renderer';
import MainMenu from './MainMenu';

export default class InGame extends GameScreen {
    #currentLevel: Level;
    #camera: Camera;
    #pauseManager: PauseManager;

    constructor(container: HTMLElement) {
        super(container);
        
        this.#currentLevel = new Level(startingLevel);
        this.#camera = new Camera(this.#currentLevel);
        this.#pauseManager = new PauseManager();
    }

    #fps = 0;
    update(deltaTime: number, input: Input): void {
        this.#fps = 1 / deltaTime;

        this.#pauseManager.processInput(input);
        if (this.#pauseManager.paused)
            return;

        this.#currentLevel.update(deltaTime, input);
        this.#currentLevel.centerCameraAtPlayer(this.#camera);

        if (this.#currentLevel.playerHasReachedGoal) {
            if (this.#currentLevel.nextLevel !== null)
                this.#transitionLevel(this.#currentLevel.nextLevel);
            else
                this.transitionTo(new MainMenu(this.container))
        }
    }

    render(renderer: Renderer): void {
        renderer.camera = this.#camera;

        if (this.#currentLevel.status === 'loaded') {
            this.#currentLevel.render(renderer);
        } else {
            const text = this.#currentLevel.status === 'loading' ?
                `Loading level ${this.#currentLevel.levelNumber}...` :
                ':(';

            renderer.renderText(
                text,
                '30px sans-serif',
                'center',
                'middle',
                this.#camera.center,
                {
                    type: 'fill',
                    style: 'white',
                }
            );
        }

        renderer.renderFps(this.#fps);
    }

    #transitionLevel(levelNum: number) {
        this.#currentLevel = new Level(levelNum);
        this.#camera = new Camera(this.#currentLevel);
    }
}

const startingLevel = 2;

class PauseManager {
    get paused(): boolean {
        return this.#paused;
    }

    processInput(input: Input) {
        this.#processPauseInput(input.pause);
    }
    
    #paused = false;
    #modal: HTMLDivElement | null = null;

    #processPauseInput(pause: KeyState) {
        if (pause.pressed && !pause.repeat) {
            this.#paused = !this.#paused;

            if (this.#paused) {
                this.#modal = document.createElement('div');
                this.#modal.classList.add('pause');
                this.#modal.textContent = 'Paused';

                document.body.appendChild(this.#modal);
            } else {
                this.#modal!.remove();
                this.#modal = null;
            }
        }
    }
}
