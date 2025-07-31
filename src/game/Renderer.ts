export default class Renderer {
    #container: HTMLElement;
    #canvas: HTMLCanvasElement;
    #context: CanvasRenderingContext2D;

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
    }

    #resizeCanvas() {
        let height = this.#container.clientHeight;
        let width = height * aspectRatio;

        if (width > this.#container.clientWidth) {
            width = this.#container.clientWidth;
            height = width / aspectRatio;
        }

        this.#canvas.width = width;
        this.#canvas.height = height;
    }

    beginFrame() {
        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    }

    render(renderable: Renderable) {
        renderable.render(this.#context);
    }

    renderTest(fps: number) {
        this.#context.fillStyle = 'red';
        this.#context.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        this.#context.strokeStyle = 'black';
        this.#context.lineWidth = 10;
        this.#context.strokeRect(0, 0, this.#canvas.width, this.#canvas.height);

        this.#context.font = '30px sans-serif';
        this.#context.textBaseline = 'top';
        this.#context.fillStyle = 'white';
        this.#context.fillText(`fps: ${fps.toFixed(1)}`, 20, 20);
    }
}

const aspectRatio = 16 / 9;

export interface Renderable {
    render(ctx: CanvasRenderingContext2D): void;
}
