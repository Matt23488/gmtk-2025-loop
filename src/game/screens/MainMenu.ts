import HtmlScreen from './HtmlScreen';
import InGame from './InGame';

export default class MainMenu extends HtmlScreen {
    protected get content(): HTMLElement {
        const container = document.createElement('div');

        const title = document.createElement('h1');
        title.textContent = 'Main Menu';

        const playButton = document.createElement('button');
        playButton.textContent = 'Play';

        playButton.addEventListener(
            'click',
            () => this.transitionTo(new InGame())
        );

        container.appendChild(title);
        container.appendChild(playButton);

        return container;
    }
}
