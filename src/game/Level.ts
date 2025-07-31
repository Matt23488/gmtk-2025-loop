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

    render(renderer: Renderer): void {
        this.#renderBackground(renderer);
        this.#renderGround(renderer);
        this.#renderTiles(renderer);
    }

    #renderBackground(renderer: Renderer): void {
        renderer.renderRect(
            [
                WorldSpaceCoordinate.from(0),
                WorldSpaceCoordinate.from(0),
            ],
            this.width,
            this.height,
            {
                passes: [
                    {
                        type: 'fill',
                        style: 'rgb(60, 150, 255)',
                    },
                    {
                        type: 'stroke',
                        style: 'green',
                        width: 5,
                    },
                ],
            }
        );
    }

    #renderGround(renderer: Renderer): void {
        // Ground
        renderer.renderRect(
            [
                WorldSpaceCoordinate.from(0),
                WorldSpaceCoordinate.from(0),
            ],
            this.width,
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

        // Ceiling
        renderer.renderRect(
            [
                WorldSpaceCoordinate.from(0),
                WorldSpaceCoordinate.from(this.height - 1),
            ],
            this.width,
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

    #renderTiles(renderer: Renderer): void {
        if (this.#data.type !== 'loaded')
            return;

        for (const tile of this.#data.data.tiles) {
            renderer.renderRect(
                tile,
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
    startPosition: Geometry.Point<WorldSpaceCoordinate>;
    goalPosition: Geometry.Point<WorldSpaceCoordinate>;
    tiles: Geometry.Point<WorldSpaceCoordinate>[];
    objects: ObjectJson[];
}

export interface ObjectJson {
    id: string;
    position: Geometry.Point<WorldSpaceCoordinate>;
}
