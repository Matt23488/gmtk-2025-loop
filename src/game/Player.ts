import { WorldSpaceCoordinate } from './Camera';
import type Level from './Level';
import type Renderer from './Renderer';

export default class Player {
    #position: Geometry.Point<WorldSpaceCoordinate>;
    #level: Level;

    constructor(level: Level) {
        this.#position = level.startPosition;
        this.#level = level;

        level.load().then(() => this.#position = level.startPosition);
    }

    get position(): Geometry.Point<WorldSpaceCoordinate> {
        return this.#position;
    }

    moveLeft(amount: WorldSpaceCoordinate) {
        let newX = this.#position[0] - amount;
        if (newX < 0) {
            newX += this.#level.width;
            this.#level.wrap();
        }

        this.#position = [
            WorldSpaceCoordinate.from(newX),
            this.#position[1],
        ];
    }

    moveRight(amount: WorldSpaceCoordinate) {
        let newX = this.#position[0] + amount;
        if (newX > this.#level.width) {
            newX -= this.#level.width;
            this.#level.wrap();
        }

        this.#position = [
            WorldSpaceCoordinate.from(newX),
            this.#position[1],
        ];
    }

    render(renderer: Renderer) {
        const [worldX, worldY] = this.#position;

        const correctedX = worldX + 0.5;
        const correctedY = worldY + 0.5;

        // for (let i = -1; i <= 1; i++)
            renderer.renderCircle(
                [
                    WorldSpaceCoordinate.from(correctedX),
                    WorldSpaceCoordinate.from(correctedY),
                ],
                // [
                //     WorldSpaceCoordinate.from(correctedX + i * this.#level.width),
                //     WorldSpaceCoordinate.from((this.#level.flipped && i === 0) || (!this.#level.flipped && i !== 0) ? this.#level.height - correctedY : correctedY)
                // ],
                WorldSpaceCoordinate.from(0.5),
                {
                    passes: [
                        {
                            type: 'fill',
                            style: 'rgb(255, 127, 0)',
                        },
                        {
                            type: 'stroke',
                            style: 'black',
                            width: 2,
                        },
                    ],
                }
            );
    }
}
