import GameScreen from './GameScreen';
import type Renderer from './Renderer';

import { Brand } from '../utils/Brand';

export default abstract class HtmlScreen extends GameScreen {
    #renderedContent: HTMLElement | null;

    constructor(container: HTMLElement) {
        super(container);

        this.#renderedContent = null;
    }

    protected abstract get template(): HtmlTemplate;
    protected initialize(_container: HTMLElement): void {}

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

        screenContainer.innerHTML = this.template.get;
        
        this.container.appendChild(screenContainer);
        this.initialize(screenContainer);

        this.#renderedContent = screenContainer;
    }
}

export const TemplateUrl = Brand<string, 'TemplateUrl'>();
export type TemplateUrl = Brand<typeof TemplateUrl>;

const htmlTemplatePromises: Array<Promise<string>> = [];

export const HtmlTemplateRegistry = {
    register(name: string, templateUrl: TemplateUrl): HtmlTemplate {
        let template: string | null = null;

        const promise = fetch(templateUrl).then(async r => template = await r.text());
        htmlTemplatePromises.push(promise);

        return {
            get get() {
                if (template === null) throw new Error(`${name} template not loaded`);
                return template;
            },
        };
    },

    async loadTemplates() {
        await Promise.allSettled(htmlTemplatePromises);
    },
};

export interface HtmlTemplate {
    get: string;
}
