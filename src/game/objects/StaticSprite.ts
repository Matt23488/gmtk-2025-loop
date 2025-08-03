import { getImage } from '../../utils';
import { WorldSpaceCoordinate } from '../Camera';
import type Renderer from '../Renderer';

export default class StaticSprite {

    constructor(name: string) {
        this.#position = [WorldSpaceCoordinate.from(0), WorldSpaceCoordinate.from(0)];
        this.#levelSize = [WorldSpaceCoordinate.from(16), WorldSpaceCoordinate.from(9)];
        this.#mobius = false;
        this.#size = [WorldSpaceCoordinate.from(1), WorldSpaceCoordinate.from(1)];

        this.#image = getSprite(name);
        this.#real = new StaticImage(this.#image);
        this.#copyA = new StaticImage(this.#image);
        this.#copyB = new StaticImage(this.#image);

        this.#copyA.flipVertical = false;
        this.#copyB.flipVertical = false;
    }

    get position(): Geometry.Point<WorldSpaceCoordinate> {
        return this.#position;
    }

    get size(): Geometry.Point<WorldSpaceCoordinate> {
        return this.#size;
    }

    set mobius(mobius: boolean) {
        this.#mobius = mobius;

        const copyFlipState = mobius ? !this.#real.flipVertical : this.#real.flipVertical;
        this.#copyA.flipVertical = copyFlipState;
        this.#copyB.flipVertical = copyFlipState;
    }

    get isFlipped(): boolean {
        return this.#real.flipVertical;
    }

    initialize(position: Geometry.Point<WorldSpaceCoordinate>, size: Geometry.Point<WorldSpaceCoordinate>, levelSize: Geometry.Point<WorldSpaceCoordinate>, mobius: boolean) {
        this.#position = position;
        this.#size = size;
        this.#levelSize = levelSize;
        this.#mobius = mobius;
        this.#copyA.flipVertical = mobius;
        this.#copyB.flipVertical = mobius;
    }

    flip() {
        this.#real.flipVertical = !this.#real.flipVertical;
        this.#copyA.flipVertical = !this.#copyA.flipVertical;
        this.#copyB.flipVertical = !this.#copyB.flipVertical;
    }

    render(renderer: Renderer) {
        this.#renderImage(this.#real, renderer, 0);
        this.#renderImage(this.#copyA, renderer, -this.#levelSize[0]);
        this.#renderImage(this.#copyB, renderer, this.#levelSize[0]);
    }

    #renderImage(image: StaticImage, renderer: Renderer, offsetX: number) {
        offsetX += (1 - this.#size[0]) / 2;

        renderer.renderImage(
            image,
            [
                WorldSpaceCoordinate.from(this.#position[0] + offsetX),
                image.flipVertical ? this.#flipY(this.#position[1]) : this.#position[1],
            ],
            this.#size
        );
    }

    #flipY(y: WorldSpaceCoordinate): WorldSpaceCoordinate {
        if (this.#mobius || this.isFlipped) {
            const offsetY = 1 - this.#size[1];
            return WorldSpaceCoordinate.from(this.#levelSize[1] + offsetY - y - 1);
        }
        else
            return y;
    }

    #image: HTMLImageElement;
    #position: Geometry.Point<WorldSpaceCoordinate>;
    #size: Geometry.Point<WorldSpaceCoordinate>;
    #levelSize: Geometry.Point<WorldSpaceCoordinate>;
    #mobius: boolean;
    #real: StaticImage;
    #copyA: StaticImage;
    #copyB: StaticImage;
}

export class StaticImage {
    flipVertical = false;

    constructor(image: HTMLImageElement) {
        this.#image = image;
        this.#width = WorldSpaceCoordinate.from(image.naturalWidth);
        this.#height = WorldSpaceCoordinate.from(image.naturalHeight / 2);
    }

    get renderParams(): [CanvasImageSource, number, number, number, number] {
        return [
            this.#image,
            0,
            this.flipVertical ? this.#height : 0,
            this.#width,
            this.#height, 
        ];
    }

    #image: HTMLImageElement;
    #width: WorldSpaceCoordinate;
    #height: WorldSpaceCoordinate;
}

function getSprite(name: string) {
    switch (name) {
        case 'Start': return startImg;
        case 'UpArrow': return upArrowImg;
        case 'DownArrow': return downArrowImg;
        case 'Rock': return rockImg;
        case 'Mice': return miceImg;
        default: return getImage(`${import.meta.env.BASE_URL}Sprites/${name}.png`);
    }
}

import Start from '/Sprites/Start.png';
import UpArrow from '/Sprites/UpArrow.png';
import DownArrow from '/Sprites/DownArrow.png';
import Rock from '/Sprites/Rock.png';
import Mice from '/Sprites/Mice.png';

const startImg = getImage(Start);
const upArrowImg = getImage(UpArrow);
const downArrowImg = getImage(DownArrow);
const rockImg = getImage(Rock);
const miceImg = getImage(Mice);
