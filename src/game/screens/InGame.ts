import Camera from '../Camera';
import GameScreen from '../GameScreen';
import { FlipFlop } from '../Input';
import type Input from '../Input';
import Level from '../Level';
import type Renderer from '../Renderer';
import MainMenu from './MainMenu';

const startingLevel = 0;

export default class InGame extends GameScreen {
    #currentLevel: Level;
    #camera: Camera;
    #pauseManager: PauseManager;
    #debugFlipFlop: FlipFlop;

    constructor(container: HTMLElement) {
        super(container);
        
        this.#currentLevel = new Level(startingLevel);
        this.#camera = new Camera(this.#currentLevel);
        this.#pauseManager = new PauseManager();
        this.#debugFlipFlop = new FlipFlop('debug');
    }

    #fps = 0;
    update(deltaTime: number, input: Input): void {
        this.#fps = 1 / deltaTime;

        this.#pauseManager.processInput(input);
        if (this.#pauseManager.paused)
            return;

        if (input.restart.pressed && !input.restart.repeat)
            this.#transitionLevel(this.#currentLevel.levelNumber);

        this.#debugFlipFlop.processInput(input);

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

        if (this.#debugFlipFlop.isSet)
            renderer.renderFps(this.#fps);
    }

    #transitionLevel(levelNum: number) {
        this.#currentLevel = new Level(levelNum);
        this.#camera = new Camera(this.#currentLevel);
        this.#currentLevel.debugEnabled = this.#debugFlipFlop.isSet;
    }
}

class PauseManager {
    constructor() {
        this.#pauseFlipFlop = new FlipFlop('pause');
        this.#modal = null;

        this.#pauseFlipFlop.onSet = () => {
            this.#modal = document.createElement('div');
            this.#modal.classList.add('pause');
            this.#modal.textContent = 'Paused';

            document.body.appendChild(this.#modal);
        };

        this.#pauseFlipFlop.onReset = () => {
            this.#modal?.remove();
            this.#modal = null;
        };
    }

    get paused(): boolean {
        return this.#pauseFlipFlop.isSet;
    }

    processInput(input: Input) {
        this.#pauseFlipFlop.processInput(input);
    }
    
    #pauseFlipFlop: FlipFlop;
    #modal: HTMLDivElement | null;
}
