import type { WorldSpaceCoordinate } from '../Camera';
import type Level from '../Level';
import type Renderer from '../Renderer';
import type StaticSprite from './StaticSprite';

export default abstract class Trigger {
    constructor(sprite: StaticSprite, flipped: boolean) {
        this.#sprite = sprite;
        this.#activated = false;

        if (flipped)
            this.flip();
    }

    get position(): Geometry.Point<WorldSpaceCoordinate> {
        return this.#sprite.position;
    }

    get size(): Geometry.Point<WorldSpaceCoordinate> {
        return this.#sprite.size;
    }

    set mobius(mobius: boolean) {
        this.#sprite.mobius = mobius;
    }

    activate(_level: Level): void {
        this.#activated = true;
    }

    isActivated(position: Geometry.Point<WorldSpaceCoordinate>, size: Geometry.Point<WorldSpaceCoordinate>): boolean {
        if (this.#activated || this.#sprite.isFlipped)
            return false;

        return this.#isOverlapping2D(
            [
                [this.position[0], this.position[0] + this.size[0]],
                [this.position[1], this.position[1] + this.size[1]],
            ],
            [
                [position[0], position[0] + size[0]],
                [position[1], position[1] + size[1]],
            ]
        );
    }

    render(renderer: Renderer) {
        this.#sprite.render(renderer);
    }

    flip() {
        this.#sprite.flip();
    }

    #sprite: StaticSprite;
    #activated: boolean;

    #isOverlapping1D([aMin, aMax]: Geometry.Point, [bMin, bMax]: Geometry.Point): boolean {
        return aMax >= bMin && bMax >= aMin;
    }

    #isOverlapping2D([aX, aY]: Box, [bX, bY]: Box): boolean {
        return this.#isOverlapping1D(aX, bX) && this.#isOverlapping1D(aY, bY);
    }
}

export type TriggerJson = [name: string, x: WorldSpaceCoordinate, y: WorldSpaceCoordinate, w: WorldSpaceCoordinate, h: WorldSpaceCoordinate, flipped?: true];

type Box = [Geometry.Point, Geometry.Point];
