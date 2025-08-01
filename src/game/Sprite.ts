export default class Sprite {
    #name: string;
    #status: Utils.LoadStatus;
    #spriteSheet: HTMLImageElement;
    #width: number;
    #height: number;
    #animations: AnimationJson[];
    #animation: AnimationJson;
    #animationIndex = -1;
    #animationFrame = 0;
    #animationDeltaTime = 0;

    constructor(name: string) {
        this.#name = name;
        this.#status = 'loading';
        this.#spriteSheet = this.#loadImage(name);
        this.#width = 1;
        this.#height = 1;
        this.#animations = [];
        this.#animation = this.#animations[0];

        fetch(`${import.meta.env.BASE_URL}Sprites/${name}.json`)
            .then(r => r.json())
            .then((data: SpriteJson) => {
                this.#status = 'loaded';
                this.#width = data.width;
                this.#height = data.height;
                this.#animations = data.animations;
            })
            .catch(() => this.#status = 'error');
    }

    get image(): CanvasImageSource {
        return this.#spriteSheet;
    }

    get subImageParameters(): [number, number, number, number] {
        const x = this.#animationFrame * this.#width;
        let y = this.#animationIndex * this.#height;

        if (this.flipHorizontal) y += this.#animations.length * this.#height;
        if (this.flipVertical) y += this.#animations.length * 2 * this.#height;

        return [x, y, this.#width, this.#height];
    }

    playAnimation(animationIndex: number) {
        if (animationIndex === this.#animationIndex || this.#status !== 'loaded')
            return;

        if (animationIndex < 0 || animationIndex >= this.#animations.length)
            throw new Error(`Invalid anmiation index ${animationIndex} for ${this.#name}`);

        this.#animation = this.#animations[animationIndex];
        this.#animationIndex = animationIndex;
        this.#animationFrame = 0;
        this.#animationDeltaTime = 0;
    }

    animate(deltaTime: number) {
        if (this.#status !== 'loaded')
            return;
        
        let animationDeltaTime = this.#animationDeltaTime + deltaTime;
        if (animationDeltaTime > this.#animation.duration)
            animationDeltaTime = 0;

        this.#animationFrame = Math.floor(animationDeltaTime / this.#animation.duration * this.#animation.numFrames);
        this.#animationDeltaTime = animationDeltaTime;
    }

    #loadImage(name: string): HTMLImageElement {
        const img = document.createElement('img');
        img.src = `${import.meta.env.BASE_URL}Sprites/${name}.png`;;
        img.onload = () => {};

        return img;
    }

    flipHorizontal = false;
    flipVertical = false;

}

interface SpriteJson {
    width: number;
    height: number;
    animations: AnimationJson[];
}

interface AnimationJson {
    numFrames: number;
    duration: number;
}
