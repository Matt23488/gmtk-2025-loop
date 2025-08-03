import HtmlScreen, { type HtmlTemplate } from '../HtmlScreen';
import MainMenu from './MainMenu';

const template = { get: '' };

export default class EndCard extends HtmlScreen {
    protected get template(): HtmlTemplate {
        return template;
    }

    protected initialize(container: HTMLElement): void {
        const img = document.createElement('img');
        img.classList.add('end-card');
        img.src = `${import.meta.env.BASE_URL}EndCard.png`;

        container.appendChild(img);

        const abortController = new AbortController();

        document.addEventListener('keyup', e => {
            switch (e.key) {
                case 'Escape':
                case 'Enter':
                    abortController.abort();
                    this.transitionTo(new MainMenu(this.container));
                    break;
            }            
        }, { signal: abortController.signal });
    }
}
