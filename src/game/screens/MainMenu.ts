import HtmlScreen, { HtmlTemplateRegistry, TemplateUrl, type HtmlTemplate } from '../HtmlScreen';
import InGame from './InGame';

import templateUrl from '/MainMenu.html?url';

const template = HtmlTemplateRegistry.register('MainMenu', TemplateUrl.from(templateUrl));

export default class MainMenu extends HtmlScreen {
    protected get template(): HtmlTemplate {
        return template;
    }

    protected initialize(container: HTMLElement): void {
        const playBtn = container.querySelector<HTMLButtonElement>('#mainMenu__playBtn')!;

        playBtn.addEventListener('click', () => this.transitionTo(new InGame(this.container)));
    }
}
