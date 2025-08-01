export default class Sprite {
    #img: HTMLImageElement;

    constructor(name: string) {
        const url = `${import.meta.env.BASE_URL}Sprites/${name}.png`;

        this.#img = document.createElement('img');
        this.#img.src = url;
        this.#img.onload = () => {};
    }

    get image(): CanvasImageSource {
        return this.#img;
    }
}
