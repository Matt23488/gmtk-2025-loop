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

    update(_: number): void {}
    render(_: Renderer): void {}
}
