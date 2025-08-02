import { getImage } from '../utils';
import { TypeExhaustionError } from '../utils/Errors';
import { WorldSpaceCoordinate } from './Camera';

export default class TileSheet {
    #img: HTMLImageElement;
    #width: number;
    #height: number;

    constructor(name: string) {
        const url = `${import.meta.env.BASE_URL}Tiles/${name}.png`;

        this.#img = getImage(url, () => {
            this.#width = this.#img.naturalWidth / 3;
            this.#height = this.#img.naturalHeight / 3;
        });

        this.#width = 1;
        this.#height = 1;
    }

    get image(): CanvasImageSource {
        return this.#img;
    }

    get width(): WorldSpaceCoordinate {
        return WorldSpaceCoordinate.from(this.#width);
    }

    get height(): WorldSpaceCoordinate {
        return WorldSpaceCoordinate.from(this.#height);
    }

    static getVerticallyFlippedPiece(piece: TilePiece): TilePiece {
        switch (piece) {
            case 'top': return 'bottom';
            case 'top-right': return 'bottom-right';
            case 'bottom-right': return 'top-right';
            case 'bottom': return 'top';
            case 'bottom-left': return 'top-left';
            case 'top-left': return 'bottom-left';
            default: return piece;
        }
    }

    getTilePieceBoundaries(piece: TilePiece): [number, number, number, number] {
        let x = 0;
        let y = 0;

        switch (piece) {
            case 'top':
                x += this.#width;
                break;
            case 'top-right':
                x += this.#width * 2;
                break;
            case 'right':
                x += this.#width * 2;
                y += this.#height;
                break;
            case 'bottom-right':
                x += this.#width * 2;
                y += this.#height * 2;
                break;
            case 'bottom':
                x += this.#width;
                y += this.#height * 2;
                break;
            case 'bottom-left':
                y += this.#height * 2;
                break;
            case 'left':
                y += this.#height;
                break;
            case 'top-left': // Do nothing
                break;
            case 'center':
                x += this.#width;
                y += this.#height;
                break;
            default:
                throw new TypeExhaustionError('TilePiece', piece);
        }

        return [x, y, this.#width, this.#height];
    }
}

export type TilePiece =
    | 'top'
    | 'top-right'
    | 'right'
    | 'bottom-right'
    | 'bottom'
    | 'bottom-left'
    | 'left'
    | 'top-left'
    | 'center';
