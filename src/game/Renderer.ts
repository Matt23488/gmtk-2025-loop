import { TypeExhaustionError } from '../utils/Errors';
import type Background from './Background';
import { ScreenSpaceCoordinate, WorldSpaceCoordinate } from './Camera';
import Camera from './Camera';
import type Goal from './Goal';
import type Sprite from './Sprite';
import type TileSheet from './TileSheet';
import type { TilePiece } from './TileSheet';

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

    renderRect(position: Geometry.Point<WorldSpaceCoordinate>, size: Geometry.Point<WorldSpaceCoordinate>, ...passes: RenderPass[]) {
        const [x, y] = this.camera.transformPoint(position, this.screenDimensions);
        const [w, h] = this.camera.transformDimensions(size, this.screenDimensions);

        const callObj: RenderCallObj = {
            fill: () => this.#context.fillRect(x, y, w, h),
            stroke: () => this.#context.strokeRect(x, y, w, h),
        };

        this.#render(passes, callObj);
    }

    renderText(text: string, font: string, align: CanvasTextAlign, baseline: CanvasTextBaseline, position: Geometry.Point<WorldSpaceCoordinate>, ...passes: RenderPass[]) {//...[worldPosition, text, font, textAlign, textBaseline, options]: RenderPrimativeArgs<'text'>) {
        this.#context.font = font;
        this.#context.textAlign = align;
        this.#context.textBaseline = baseline;

        const [x, y] = this.camera.transformPoint(position, this.screenDimensions);

        const callObj: RenderCallObj = {
            fill: () => this.#context.fillText(text, x, y),
            stroke: () => this.#context.strokeText(text, x, y),
        };

        this.#render(passes, callObj);
    }

    renderCircle(position: Geometry.Point<WorldSpaceCoordinate>, radius: WorldSpaceCoordinate, ...passes: RenderPass[]) {
        const [x, y] = this.camera.transformPoint(position, this.screenDimensions);
        const [screenRadius] = this.camera.transformDimensions([radius, WorldSpaceCoordinate.from(0)], this.screenDimensions);

        const beginCircle = () => {
            this.#context.beginPath();
            this.#context.arc(x, y, screenRadius, 0, Math.PI * 2);
        }

        const callObj: RenderCallObj = {
            fill: () => {
                beginCircle();
                this.#context.fill();
            },
            stroke: () => {
                beginCircle();
                this.#context.stroke();
            },
        };

        this.#render(passes, callObj);
    }

    renderSprite(sprite: Sprite, position: Geometry.Point<WorldSpaceCoordinate>, size: Geometry.Point<WorldSpaceCoordinate>) {
        const [x, y] = this.camera.transformPoint(position, this.screenDimensions);
        const [w, h] = this.camera.transformDimensions(size, this.screenDimensions);

        this.#context.drawImage(
            sprite.image,
            ...sprite.subImageParameters,
            x, y, w, h
        );
    }

    renderTile(tile: TileSheet, piece: TilePiece, position: Geometry.Point<WorldSpaceCoordinate>, size: Geometry.Point<WorldSpaceCoordinate>) {
        const [x, y] = this.camera.transformPoint(position, this.screenDimensions);
        const [w, h] = this.camera.transformDimensions(size, this.screenDimensions);

        this.#context.drawImage(
            tile.image,
            ...tile.getTilePieceBoundaries(piece),
            x, y, w, h
        );
    }

    renderGoal(goal: Goal, position: Geometry.Point<WorldSpaceCoordinate>, size: Geometry.Point<WorldSpaceCoordinate>) {
        const [x, y] = this.camera.transformPoint(goal.offset(position), this.screenDimensions);
        const [w, h] = this.camera.transformDimensions(size, this.screenDimensions);

        this.#context.drawImage(
            goal.image,
            x, y, w, h
        );
    }

    renderBackground(background: Background, position: Geometry.Point<WorldSpaceCoordinate>, size: Geometry.Point<WorldSpaceCoordinate>) {
        const [x, y] = this.camera.transformPoint(position, this.screenDimensions);
        const [w, h] = this.camera.transformDimensions(size, this.screenDimensions);

        this.#context.save();

        this.#context.translate(background.parallaxOffset, 0);
        this.#context.fillStyle = this.#context.createPattern(background.image, 'repeat')!;
        this.#context.fillRect(x, y, w, h);

        this.#context.restore();
    }

    renderFps(fps: number) {
        this.#context.font = '30px sans-serif';
        this.#context.textAlign = 'left';
        this.#context.textBaseline = 'top';
        this.#context.fillStyle = 'white';
        this.#context.fillText(`fps: ${fps.toFixed(1)}`, 20, 20);
    }

    #renderPass(pass: RenderPass, callObj: RenderCallObj) {
        switch (pass.type) {
            case 'fill':
                this.#context.fillStyle = pass.style;
                break;
            case 'stroke':
                this.#context.strokeStyle = pass.style;
                this.#context.lineWidth = pass.width;
                break;
            default:
                throw new TypeExhaustionError('RenderPass', pass);
        }

        callObj[pass.type]();
    }

    #render(passes: RenderPass[], callObj: RenderCallObj) {
        for (const pass of passes)
            this.#renderPass(pass, callObj);
    }
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

type RenderCallObj = Record<RenderPassType, () => void>;
