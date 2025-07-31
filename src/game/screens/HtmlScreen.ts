import GameScreen from '../GameScreen';
import type Renderer from '../Renderer';

import { Brand } from '../../utils/Brand';

export default abstract class HtmlScreen extends GameScreen {
    #renderedContent: HTMLElement | null;
    #container: HTMLElement;

    constructor(container: HTMLElement) {
        super();

        this.#renderedContent = null;
        this.#container = container;
    }

    protected abstract get template(): HtmlTemplate;
    protected get cssUrl(): string | null { return null; }
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

        if (this.cssUrl !== null) {
            const styles = document.createElement('link');
            styles.rel = 'stylesheet';
            styles.href = this.cssUrl;

            screenContainer.prepend(styles);
        }
        
        this.#container.appendChild(screenContainer);
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
