import { WorldSpaceCoordinate } from './Camera';
import type Renderer from './Renderer';

export default class Level {
    #data: LevelData;

    constructor(levelNumber: number) {
        this.#data = { type: 'loading' };

        const url = `${import.meta.env.BASE_URL}Levels/${levelNumber}.json`;
        fetch(url)
            .then(r => r.json())
            // .then(async data => {
            //     await new Promise(resolve => setTimeout(resolve, 5000));
            //     return data;
            // })
            .then(data => this.#data = { type: 'loaded', data })
            .catch(error => this.#data = { type: 'error', error });
    }

    public get status(): LevelStatus {
        return this.#data.type;
    }

    public get width(): WorldSpaceCoordinate {
        if (this.#data.type === 'loaded')
            return this.#data.data.width;

        return WorldSpaceCoordinate.from(1);
    }

    public get height(): WorldSpaceCoordinate {
        if (this.#data.type === 'loaded')
            return this.#data.data.height;

        return WorldSpaceCoordinate.from(1);
    }

    public get mobius(): boolean {
        if (this.#data.type === 'loaded')
            return this.#data.data.mobius;

        return false;
    }

    #flipped = false;
    wrap() {
        if (this.mobius)
            this.#flipped = !this.#flipped;
    }

    render(renderer: Renderer): void {
        this.#renderBackground(renderer);
        this.#renderGround(renderer);
        this.#renderTiles(renderer);
        this.#renderStart(renderer);
        this.#renderGoal(renderer);

        // Debug text
        for (let i = -1; i <= 1; i++)
            renderer.renderText(
                [
                    WorldSpaceCoordinate.from(16 + i * this.width),
                    WorldSpaceCoordinate.from(9),
                ],
                'A/D or Left/Right to move camera',
                'bold 50px sans-serif',
                'center',
                'middle',
                {
                    passes: [
                        {
                            type: 'fill',
                            style: 'white',
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

    #renderBackground(renderer: Renderer): void {
        for (let i = -1; i <= 1; i++)
            renderer.renderRect(
                [
                    WorldSpaceCoordinate.from(-1 + i * this.width),
                    WorldSpaceCoordinate.from(0),
                ],
                WorldSpaceCoordinate.from(this.width + 2),
                this.height,
                {
                    passes: [
                        {
                            type: 'fill',
                            style: 'rgb(60, 150, 255)',
                        },
                    ],
                }
            );
    }

    #renderGround(renderer: Renderer): void {
        // Ground
        for (let i = 0; i < this.width; i++)
            this.#renderTile(renderer, [
                WorldSpaceCoordinate.from(i),
                WorldSpaceCoordinate.from(0),
            ]);

        // Ceiling
        for (let i = 0; i < this.width; i++)
            this.#renderTile(renderer, [
                WorldSpaceCoordinate.from(i),
                WorldSpaceCoordinate.from(this.height - 1),
            ]);
    }

    #renderTiles(renderer: Renderer): void {
        if (this.#data.type !== 'loaded')
            return;

        for (const tile of this.#data.data.tiles) {
            this.#renderTile(renderer, tile);
        }
    }

    #renderTile(renderer: Renderer, position: Geometry.Point<WorldSpaceCoordinate>, copy = false): void {
        const [worldX, worldY] = position;
        const correctedWorldY = WorldSpaceCoordinate.from(this.#flipped && !copy ? this.height - worldY - 1 : worldY);

        if (!copy) {
            const copyY = this.mobius ? this.height - correctedWorldY - 1 : correctedWorldY;
                
            const leftCopyPosition = [WorldSpaceCoordinate.from(worldX - this.width), copyY] as Geometry.Point<WorldSpaceCoordinate>;
            const rightCopyPosition = [WorldSpaceCoordinate.from(worldX + this.width), copyY] as Geometry.Point<WorldSpaceCoordinate>;

            this.#renderTile(renderer, leftCopyPosition, true);
            this.#renderTile(renderer, rightCopyPosition, true);
        }

        renderer.renderRect(
            [worldX, correctedWorldY],
            WorldSpaceCoordinate.from(1),
            WorldSpaceCoordinate.from(1),
            {
                passes: [
                    {
                        type: 'fill',
                        style: 'brown',
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

    #renderStart(renderer: Renderer) {
        if (this.#data.type !== 'loaded')
            return;

        const [worldX, worldY] = this.#data.data.startPosition;

        const correctedX = worldX + 0.5;
        const correctedY = worldY + 0.5;

        for (let i = -1; i <= 1; i++)
            renderer.renderCircle(
                [
                    WorldSpaceCoordinate.from(correctedX + i * this.width),
                    WorldSpaceCoordinate.from((this.#flipped && i === 0) || (!this.#flipped && i !== 0) ? this.height - correctedY : correctedY),
                ],
                WorldSpaceCoordinate.from(0.3),
                {
                    passes: [
                        {
                            type: 'fill',
                            style: 'rgb(0, 100, 0)',
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

    #renderGoal(renderer: Renderer) {
        if (this.#data.type !== 'loaded')
            return;

        const [worldX, worldY] = this.#data.data.goalPosition;

        const correctedX = worldX + 0.5;
        const correctedY = worldY + 0.5;

        for (let i = -1; i <= 1; i++)
            renderer.renderCircle(
                [
                    WorldSpaceCoordinate.from(correctedX + i * this.width),
                    WorldSpaceCoordinate.from((this.#flipped && i === 0) || (!this.#flipped && i !== 0) ? this.height - correctedY : correctedY),
                ],
                WorldSpaceCoordinate.from(0.3),
                {
                    passes: [
                        {
                            type: 'fill',
                            style: 'rgb(100, 0, 100)',
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

export type LevelData = Utils.DiscriminatedUnion<LevelDataTypeMap>;
export type LevelStatus = LevelData['type'];

interface LevelDataTypeMap {
    loading: {};
    loaded: { data: LevelJson };
    error: { error: unknown };
}

export interface LevelJson {
    width: WorldSpaceCoordinate;
    height: WorldSpaceCoordinate;
    mobius: boolean;
    startPosition: Geometry.Point<WorldSpaceCoordinate>;
    goalPosition: Geometry.Point<WorldSpaceCoordinate>;
    tiles: Geometry.Point<WorldSpaceCoordinate>[];
    objects: ObjectJson[];
}

export interface ObjectJson {
    id: string;
    position: Geometry.Point<WorldSpaceCoordinate>;
}
