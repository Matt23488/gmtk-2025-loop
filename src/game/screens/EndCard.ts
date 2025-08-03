import HtmlScreen, { type HtmlTemplate } from '../HtmlScreen';
import Credits from './Credits';

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

        const showCredits = () => {
            abortController.abort();
            this.transitionTo(new Credits(this.container));
        };

        document.addEventListener('keyup', e => {
            switch (e.key) {
                case 'Escape':
                case 'Enter':
                    showCredits();
                    break;
            }            
        }, { signal: abortController.signal });

        setTimeout(showCredits, 5000);
    }
}
