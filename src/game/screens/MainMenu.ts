import HtmlScreen, { HtmlTemplateRegistry, TemplateUrl, type HtmlTemplate } from '../HtmlScreen';
import Credits from './Credits';
import InGame from './InGame';

import templateUrl from '/MainMenu.html?url';

const template = HtmlTemplateRegistry.register('MainMenu', TemplateUrl.from(templateUrl));

export default class MainMenu extends HtmlScreen {
    protected get template(): HtmlTemplate {
        return template;
    }

    protected initialize(container: HTMLElement): void {
        const playBtn = container.querySelector<HTMLButtonElement>('#mainMenu__playBtn')!;
        const creditsBtn = container.querySelector<HTMLButtonElement>('#mainMenu__creditsBtn')!;

        playBtn.addEventListener('click', () => this.transitionTo(new InGame(this.container)), { once: true });
        creditsBtn.addEventListener('click', () => this.transitionTo(new Credits(this.container)), { once: true });

        playBtn.focus();
    }
}
