import { Brand } from '../utils/Brand';
import type Level from './Level';

export default class Camera {
    #level: Level;
    #position: WorldSpaceCoordinate;

    static readonly aspectRatio = 16 / 9;

    constructor(level: Level) {
        this.#level = level;
        this.#position = WorldSpaceCoordinate.from(0);
    }

    get center(): Geometry.Point<WorldSpaceCoordinate> {
        return [
            WorldSpaceCoordinate.from(this.width / 2 + this.#position),
            WorldSpaceCoordinate.from(this.#level.height / 2),
        ];
    }

    get width(): WorldSpaceCoordinate {
        return WorldSpaceCoordinate.from(Camera.aspectRatio * this.#level.height);
    }

    centerAt(position: WorldSpaceCoordinate) {
        this.#position = WorldSpaceCoordinate.from(position - this.width / 2);
    }

    transformPoint(point: Geometry.Point<WorldSpaceCoordinate>, screenDimensions: Geometry.Point<ScreenSpaceCoordinate>): Geometry.Point<ScreenSpaceCoordinate> {
        const [worldX, worldY] = point;
        const [screenFullWidth, screenFullHeight] = screenDimensions;

        const screenX = ScreenSpaceCoordinate.from((worldX - this.#position) / this.width * screenFullWidth);
        const screenY = ScreenSpaceCoordinate.from((1 - worldY / this.#level.height) * screenFullHeight);

        return [screenX, screenY];
    }

    transformDimensions(dimensions: Geometry.Point<WorldSpaceCoordinate>, screenDimensions: Geometry.Point<ScreenSpaceCoordinate>): Geometry.Point<ScreenSpaceCoordinate> {
        const [worldWidth, worldHeight] = dimensions;
        const [screenFullWidth, screenFullHeight] = screenDimensions;

        const screenWidth = ScreenSpaceCoordinate.from(worldWidth / this.width * screenFullWidth);
        const screenHeight = ScreenSpaceCoordinate.from(-worldHeight / this.#level.height * screenFullHeight);

        return [screenWidth, screenHeight];
    }
}

export const ScreenSpaceCoordinate = Brand<number, 'ScreenSpaceCoordinate'>();
export type ScreenSpaceCoordinate = Brand<typeof ScreenSpaceCoordinate>;

export const WorldSpaceCoordinate = Brand<number, 'WorldSpaceCoordinate'>();
export type WorldSpaceCoordinate = Brand<typeof WorldSpaceCoordinate>;
