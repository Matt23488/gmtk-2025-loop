import { TypeExhaustionError } from '../utils/Errors';
import { ScreenSpaceCoordinate, type WorldSpaceCoordinate } from './Camera';
import Camera from './Camera';

export default class Renderer {
    #container: HTMLElement;
    #canvas: HTMLCanvasElement;
    #context: CanvasRenderingContext2D;
    #camera: Camera | null;

    constructor(container: HTMLElement) {
        this.#container = container;
        this.#canvas = document.createElement('canvas');

        const resizeObserver = new ResizeObserver(this.#resizeCanvas.bind(this));
        resizeObserver.observe(container);

        this.#resizeCanvas();
        this.#container.appendChild(this.#canvas);

        const context = this.#canvas.getContext('2d');
        if (!context) throw new Error('Canvas context null');

        this.#context = context;
        this.#camera = null;
    }

    #resizeCanvas() {
        let height = this.#container.clientHeight;
        let width = height * Camera.aspectRatio;

        if (width > this.#container.clientWidth) {
            width = this.#container.clientWidth;
            height = width / Camera.aspectRatio;
        }

        this.#canvas.width = width;
        this.#canvas.height = height;
    }

    beginFrame() {
        this.#context.imageSmoothingEnabled = false;
        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    }

    get camera() {
        if (!this.#camera)
            throw new Error('Cannot get camera');

        return this.#camera;
    }

    set camera(camera: Camera) {
        this.#camera = camera;
    }

    get screenDimensions(): Geometry.Point<ScreenSpaceCoordinate> {
        return [
            ScreenSpaceCoordinate.from(this.#canvas.width),
            ScreenSpaceCoordinate.from(this.#canvas.height),
        ];
    }

    renderRect(...[worldPosition, worldWidth, worldHeight, options]: RenderPrimativeArgs<'rect'>) {
        const screenPosition = this.camera.transformPoint(worldPosition, this.screenDimensions);
        const screenDimensions = this.camera.transformDimensions([worldWidth, worldHeight], this.screenDimensions);

        this.#render(options, 'Rect', ...screenPosition, ...screenDimensions);
    }

    renderText(...[worldPosition, text, font, textAlign, textBaseline, options]: RenderPrimativeArgs<'text'>) {
        this.#context.font = font;
        this.#context.textAlign = textAlign;
        this.#context.textBaseline = textBaseline;

        const screenPosition = this.camera.transformPoint(worldPosition, this.screenDimensions);

        this.#render(options, 'Text', text, ...screenPosition);
    }

    renderFps(fps: number) {
        this.#context.font = '30px sans-serif';
        this.#context.textAlign = 'left';
        this.#context.textBaseline = 'top';
        this.#context.fillStyle = 'white';
        this.#context.fillText(`fps: ${fps.toFixed(1)}`, 20, 20);
    }

    #renderPass<Primative extends RenderPrimative>(pass: RenderPass, call: Capitalize<Primative>): Utils.AnyFunction {
        switch (pass.type) {
            case 'fill':
                this.#context.fillStyle = pass.style;
                return this.#context[`fill${call}`].bind(this.#context);
            case 'stroke':
                this.#context.strokeStyle = pass.style;
                this.#context.lineWidth = pass.width;
                return this.#context[`stroke${call}`].bind(this.#context);
            default:
                throw new TypeExhaustionError('RenderPass', pass);
        }
    }

    #render<Primative extends RenderPrimative>(options: RenderPrimativeOptions, call: Capitalize<Primative>, ...args: RenderCallArgs<Capitalize<Primative>>) {
        for (const pass of options.passes)
            this.#renderPass(pass, call)(...args);
    }
}

export type RenderPrimative = keyof RenderPrimativeTypeMap;

interface RenderPrimativeTypeMap {
    rect: [width: WorldSpaceCoordinate, height: WorldSpaceCoordinate];
    text: [text: string, font: string, textAlign: CanvasTextAlign, textBaseline: CanvasTextBaseline];
}

export interface RenderPrimativeOptions {
    passes: RenderPass[];
}

export type RenderPassType = RenderPass['type'];
export type RenderPass = Utils.DiscriminatedUnion<RenderPassTypeMap>;
interface RenderPassTypeMap {
    fill: {
        style: string;
    };

    stroke: {
        style: string;
        width: number;
    };
}

type RenderCallArgs<Call extends Capitalize<RenderPrimative>> = Parameters<CanvasRenderingContext2D[`${RenderPassType}${Call}`]>;
type RenderPrimativeArgs<Primative extends RenderPrimative> = [position: Geometry.Point<WorldSpaceCoordinate>, ...RenderPrimativeTypeMap[Primative], options: RenderPrimativeOptions];
