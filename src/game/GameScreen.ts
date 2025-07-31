import type Input from './Input';
import type Renderer from './Renderer';

export default abstract class GameScreen {
    #nextScreen: GameScreen;

    constructor() {
        this.#nextScreen = this;
    }

    get nextScreen(): GameScreen {
        return this.#nextScreen;
    }

    protected transitionTo(screen: GameScreen) {
        this.#nextScreen = screen;
    }

    update(_deltaTime: number, _input: Input): void {}
    render(_renderer: Renderer): void {}
}
