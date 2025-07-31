import GameScreen from '../GameScreen';
import type Renderer from '../Renderer';

export default abstract class HtmlScreen extends GameScreen {
    #renderedContent: HTMLElement | null;
    #container: HTMLElement;

    constructor(container: HTMLElement) {
        super();

        this.#renderedContent = null;
        this.#container = container;
    }

    protected abstract get content(): HTMLElement;

    protected transitionTo(screen: GameScreen): void {
        this.#renderedContent?.remove();
        super.transitionTo(screen);
    }

    render(_: Renderer): void {
        if (this.#renderedContent)
            return;

        const screenContainer = document.createElement('div');
        screenContainer.style.position = 'absolute';
        screenContainer.style.inset = '0';
        screenContainer.style.textAlign = 'center';

        screenContainer.appendChild(this.content);
        this.#container.appendChild(screenContainer);

        this.#renderedContent = screenContainer;
    }
}