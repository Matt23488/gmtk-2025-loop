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
        if (this.#data.type !== 'loaded')
            return;

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

        for (const collision of this.#data.data.collision) {
            renderer.renderRect(
                collision.position,
                collision.width,
                collision.height, 
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
    collision: CollisionJson[]; // TODO: Change to Tile positions
    objects: ObjectJson[];

    // TODO: Start and Goal positions
}

export interface CollisionJson {
    position: Geometry.Point<WorldSpaceCoordinate>;
    width: WorldSpaceCoordinate;
    height: WorldSpaceCoordinate;
}

export interface ObjectJson {
    id: string;
    position: Geometry.Point<WorldSpaceCoordinate>;
}
