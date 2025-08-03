import HtmlScreen, { HtmlTemplateRegistry, TemplateUrl, type HtmlTemplate } from '../HtmlScreen';
import MainMenu from './MainMenu';

import templateUrl from '/Credits.html?url';

const template = HtmlTemplateRegistry.register('Credits', TemplateUrl.from(templateUrl));

export default class Credits extends HtmlScreen {
    protected get template(): HtmlTemplate {
        return template;
    }

    protected initialize(container: HTMLElement): void {
        const backBtn = container.querySelector<HTMLButtonElement>('#credits__backBtn')!;

        backBtn.addEventListener('click', () => this.transitionTo(new MainMenu(this.container)), { once: true });
        backBtn.focus();
    }
}
