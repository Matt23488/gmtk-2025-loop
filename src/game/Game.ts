import type GameScreen from './GameScreen';
import Renderer from './Renderer';
import { HtmlTemplateRegistry } from './HtmlScreen';
import MainMenu from './screens/MainMenu';
import Input from './Input';

export default class Game {
    readonly #input: Input;
    readonly #renderer: Renderer;
    #screen: GameScreen;

    constructor(container: HTMLElement) {
        this.#input = new Input();
        this.#renderer = new Renderer(container);
        this.#screen = new MainMenu(container);
    }

    async start() {
        await HtmlTemplateRegistry.loadTemplates();

        requestAnimationFrame(this.#loop.bind(this));
    }

    #lastFrameTime = 0;
    #loop(totalTime: number) {
        const deltaTime = (totalTime - this.#lastFrameTime) / 1000;
        this.#lastFrameTime = totalTime;

        this.#screen.update(deltaTime, this.#input);

        this.#renderer.beginFrame();
        this.#screen.render(this.#renderer);

        this.#screen = this.#screen.nextScreen;

        requestAnimationFrame(this.#loop.bind(this));
    }
}
