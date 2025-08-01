export default class Sprite {
    #imgR: HTMLImageElement;
    #imgL: HTMLImageElement;

    constructor(name: string) {
        this.#imgR = this.#loadImage(`${name}_R`);
        this.#imgL = this.#loadImage(`${name}_L`);
    }

    get image(): CanvasImageSource {
        return this.flipHorizontal ? this.#imgL : this.#imgR;
    }

    #loadImage(name: string): HTMLImageElement {
        const img = document.createElement('img');
        img.src = `${import.meta.env.BASE_URL}Sprites/${name}.png`;;
        img.onload = () => {};

        return img;
    }

    flipHorizontal = false;
}
