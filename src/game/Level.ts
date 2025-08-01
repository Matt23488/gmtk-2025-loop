import type Camera from './Camera';
import { WorldSpaceCoordinate } from './Camera';
import type Input from './Input';
import Player from './Player';
import type { RenderPass } from './Renderer';
import type Renderer from './Renderer';
import Sprite from './Sprite';

export default class Level {
    #player: Player;
    #playerSprite: Sprite;

    #status: LevelStatus;
    #width: WorldSpaceCoordinate;
    #height: WorldSpaceCoordinate;
    #mobius: boolean;
    #nextLevel: number | null;
    #startPosition: Geometry.Point<WorldSpaceCoordinate>;
    #goalPosition: Geometry.Point<WorldSpaceCoordinate>;
    #tiles: Geometry.Point<WorldSpaceCoordinate>[];

    constructor(levelNumber: number) {
        this.#player = new Player();
        this.#playerSprite = new Sprite('Cass');

        this.#status = 'loading';
        this.#width = WorldSpaceCoordinate.from(16);
        this.#height = WorldSpaceCoordinate.from(9);
        this.#mobius = false;
        this.#nextLevel = null;
        this.#startPosition = [WorldSpaceCoordinate.from(0), WorldSpaceCoordinate.from(1)];
        this.#goalPosition = [WorldSpaceCoordinate.from(0), WorldSpaceCoordinate.from(-1)];
        this.#tiles = [];

        const url = `${import.meta.env.BASE_URL}Levels/${levelNumber}.json`;
        fetch(url)
            .then(r => r.json())
            .then(({ width, height, mobius, nextLevel, startPosition, goalPosition, tiles }: LevelJson) => {
                this.#status = 'loaded';
                this.#width = width;
                this.#height = height;
                this.#mobius = mobius;
                this.#nextLevel = nextLevel ?? null;
                this.#startPosition = startPosition;
                this.#goalPosition = goalPosition;
                
                this.#player.x = startPosition[0];
                this.#player.y = startPosition[1];

                for (let i = 0; i < tiles.length; i++) {
                    const tileBlock = tiles[i];
                    const h = tileBlock.h ?? 1;
                    const w = tileBlock.w ?? 1;

                    for (let y = 0; y < h; y++)
                        for (let x = 0; x < w; x++)
                            this.#tiles.push([WorldSpaceCoordinate.from(tileBlock.x + x), WorldSpaceCoordinate.from(tileBlock.y + y)]);
                }
            })
            .catch(() => this.#status = 'error');
    }

    public get status(): LevelStatus {
        return this.#status;
    }

    public get height(): WorldSpaceCoordinate {
        return this.#height;
    }

    public get nextLevel(): number | null {
        return this.#nextLevel;
    }

    #flipped = false;
    get flipped(): boolean {
        return this.#flipped;
    }

    #wrap() {
        if (this.#mobius)
            this.#flipped = !this.#flipped;
    }

    centerCameraAtPlayer(camera: Camera): void {
        camera.centerAt(this.#player.position[0]);
    }

    #collidingTiles: number[] = [];
    #updatePlayer(deltaTime: number): void {

        let offsetX = WorldSpaceCoordinate.from(this.#player.velocityX * deltaTime);
        let offsetY = WorldSpaceCoordinate.from(this.#player.velocityY * deltaTime + 0.5 * -Level.g * deltaTime * deltaTime);

        const [playerX, playerY] = this.#player.position;
        const [playerWidth, playerHeight] = this.#player.size;

        let newX = playerX + offsetX;
        let newY = playerY + offsetY;

        this.#collidingTiles = [];

        if (offsetX < 0) {
            let tiles = this.#tiles;
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const collidingTile = tiles
                .filter(([tileX, tileY]) => tileX + 1 <= playerX && tileX + 1 > newX && playerY < tileY + 1 && playerY + playerHeight >= tileY)
                .sort(([ax], [bx]) => bx - ax)[0];

            if (collidingTile) {
                offsetX = WorldSpaceCoordinate.from(collidingTile[0] + 1 - playerX);
                this.#player.velocityX = WorldSpaceCoordinate.from(0);
                this.#collidingTiles.push(tiles.indexOf(collidingTile));
            }
            
        } else if (offsetX > 0) {
            let tiles = this.#tiles;
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const collidingTile = tiles
                .filter(([tileX, tileY]) => playerX + playerWidth <= tileX && newX + playerWidth > tileX && playerY < tileY + 1 && playerY + playerHeight >= tileY)
                .sort(([ax], [bx]) => ax - bx)[0];

            if (collidingTile) {
                offsetX = WorldSpaceCoordinate.from(collidingTile[0] - playerX - playerWidth - 0.01);
                this.#player.velocityX = WorldSpaceCoordinate.from(0);
                this.#collidingTiles.push(tiles.indexOf(collidingTile));
            }
        }

        if (playerY + offsetY < 1) {
            offsetY = WorldSpaceCoordinate.from(1 - playerY);
            this.#player.velocityY = WorldSpaceCoordinate.from(0);
            this.#player.onGround = true;

        } else if (playerY + offsetY + playerHeight > this.#height - 1) {
            offsetY = WorldSpaceCoordinate.from(this.#height - 1 - playerY - playerHeight);
            this.#player.velocityY = WorldSpaceCoordinate.from(0);

        } else if (offsetY < 0) {
            let tiles = this.#tiles;
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const collidingTile = tiles
                .filter(([tileX, tileY]) => tileY + 1 <= playerY && tileY + 1 > newY && playerX < tileX + 1 && playerX + playerWidth >= tileX)
                .sort(([,ay], [,by]) => by - ay)[0];

            if (collidingTile) {
                offsetY = WorldSpaceCoordinate.from(collidingTile[1] + 1 - playerY);
                this.#player.velocityY = WorldSpaceCoordinate.from(0);
                this.#player.onGround = true;
                this.#collidingTiles.push(tiles.indexOf(collidingTile));
            } else {
                this.#player.onGround = false;
            }

        } else if (offsetY > 0) {
            let tiles = this.#tiles;
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const collidingTile = tiles
                .filter(([tileX, tileY]) => playerY + playerHeight <= tileY && newY + playerHeight > tileY && playerX < tileX + 1 && playerX + playerWidth >= tileX)
                .sort(([,ay], [,by]) => ay - by)[0];

            if (collidingTile) {
                offsetY = WorldSpaceCoordinate.from(collidingTile[1] - playerY - playerHeight - 0.01);
                this.#player.velocityY = WorldSpaceCoordinate.from(0);
                this.#collidingTiles.push(tiles.indexOf(collidingTile));
            }
        }

        newX = playerX + offsetX;
        if (newX < 0) {
            newX += this.#width;
            this.#wrap();
        } else if (newX >= this.#width) {
            newX -= this.#width;
            this.#wrap();
        }

        this.#player.x = WorldSpaceCoordinate.from(newX);
        this.#player.y = WorldSpaceCoordinate.from(playerY + offsetY);
        
        this.#player.velocityY = WorldSpaceCoordinate.from(this.#player.velocityY - Level.g * deltaTime);
        this.#player.velocityX = WorldSpaceCoordinate.from(this.#player.velocityX * 0.1 * deltaTime);
    }

    get playerHasReachedGoal(): boolean {

        const [goalX, goalY] = this.#goalPosition;
        const [playerX, playerY] = this.#player.position;
        const [playerWidth, playerHeight] = this.#player.size;

        const correctedGoalY = this.flipped ? this.#height - goalY - 1 : goalY;

        const inLeftRange = playerX + playerWidth > goalX + 0.5;
        const inRightRange = playerX < goalX + 0.5;

        const inBottonRange = playerY + playerHeight > correctedGoalY + 0.5;
        const inTopRange = playerY < correctedGoalY + 0.5;

        return (inLeftRange && inRightRange) && (inBottonRange && inTopRange);
    }

    #paused = false;
    #_pausePressed = false;
    get #pausePressed(): boolean {
        return this.#_pausePressed;
    }

    set #pausePressed(value: boolean) {
        if (value && !this.#_pausePressed)
            this.#paused = !this.#paused;

        this.#_pausePressed = value;
    }

    static readonly g = 20;
    update(deltaTime: number, input: Input): void {
        this.#pausePressed = input.pausePressed;
        if (this.#paused)
            return;

        this.#player.processInput(input);
        this.#updatePlayer(deltaTime);
    }

    render(renderer: Renderer): void {
        this.#renderBackground(renderer);
        this.#renderGround(renderer);
        this.#renderTiles(renderer);
        this.#renderStart(renderer);
        this.#renderGoal(renderer);
        this.#renderPlayer(renderer);

        // Debug colliding tiles
        for (let i = 0; i < this.#collidingTiles.length; i++)
            this.#renderTile(renderer, this.#tiles[this.#collidingTiles[i]], false, true);
    }

    #renderBackground(renderer: Renderer): void {
        for (let i = -1; i <= 1; i++)
            renderer.renderRect(
                [
                    WorldSpaceCoordinate.from(-1 + i * this.#width),
                    WorldSpaceCoordinate.from(0),
                ],
                WorldSpaceCoordinate.from(this.#width + 2),
                this.#height,
                {
                    passes: [
                        {
                            type: 'fill',
                            style: 'rgb(48, 29, 0)',
                        },
                    ],
                }
            );
    }

    #renderGround(renderer: Renderer): void {
        // Ground
        for (let i = 0; i < this.#width; i++)
            this.#renderTile(renderer, [
                WorldSpaceCoordinate.from(i),
                WorldSpaceCoordinate.from(0),
            ]);

        // Ceiling
        for (let i = 0; i < this.#width; i++)
            this.#renderTile(renderer, [
                WorldSpaceCoordinate.from(i),
                WorldSpaceCoordinate.from(this.#height - 1),
            ]);
    }

    #renderTiles(renderer: Renderer): void {
        for (const tile of this.#tiles) {
            this.#renderTile(renderer, tile);
        }
    }

    #renderTile(renderer: Renderer, position: Geometry.Point<WorldSpaceCoordinate>, copy = false, debug = false): void {
        const [worldX, worldY] = position;
        const correctedWorldY = WorldSpaceCoordinate.from(this.#flipped && !copy ? this.#height - worldY - 1 : worldY);

        if (!copy) {
            const copyY = this.#mobius ? this.#height - correctedWorldY - 1 : correctedWorldY;
                
            const leftCopyPosition = [WorldSpaceCoordinate.from(worldX - this.#width), copyY] as Geometry.Point<WorldSpaceCoordinate>;
            const rightCopyPosition = [WorldSpaceCoordinate.from(worldX + this.#width), copyY] as Geometry.Point<WorldSpaceCoordinate>;

            this.#renderTile(renderer, leftCopyPosition, true);
            this.#renderTile(renderer, rightCopyPosition, true);
        }

        const passes: RenderPass[] = [
            {
                type: 'fill',
                style: 'rgb(75, 45, 0)',
            },
            {
                type: 'stroke',
                style: 'black',
                width: 2,
            },
        ];

        if (debug)
            passes.push({
                type: 'stroke',
                style: 'rgb(0, 255, 0)',
                width: 5,
            });

        renderer.renderRect(
            [worldX, correctedWorldY],
            WorldSpaceCoordinate.from(1),
            WorldSpaceCoordinate.from(1),
            { passes },
        );
    }

    #renderStart(renderer: Renderer) {

        const [worldX, worldY] = this.#startPosition;

        const correctedX = worldX + 0.5;
        const correctedY = worldY + 0.5;

        for (let i = -1; i <= 1; i++)
            renderer.renderCircle(
                [
                    WorldSpaceCoordinate.from(correctedX + i * this.#width),
                    WorldSpaceCoordinate.from((this.#flipped && i === 0) || (!this.#flipped && i !== 0 && this.#mobius) ? this.#height - correctedY : correctedY),
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

        const [worldX, worldY] = this.#goalPosition;

        const correctedX = worldX + 0.5;
        const correctedY = worldY + 0.5;

        for (let i = -1; i <= 1; i++)
            renderer.renderCircle(
                [
                    WorldSpaceCoordinate.from(correctedX + i * this.#width),
                    WorldSpaceCoordinate.from((this.#flipped && i === 0) || (!this.#flipped && i !== 0 && this.#mobius) ? this.#height - correctedY : correctedY),
                ],
                WorldSpaceCoordinate.from(0.3),
                {
                    passes: [
                        {
                            type: 'fill',
                            style: 'rgba(153, 0, 153, 1)',
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

    #renderPlayer(renderer: Renderer) {
        renderer.renderSprite(this.#playerSprite, this.#player.position, this.#player.size);
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
    nextLevel?: number;
    startPosition: Geometry.Point<WorldSpaceCoordinate>;
    goalPosition: Geometry.Point<WorldSpaceCoordinate>;
    tiles: TileJson[];
}

export interface TileJson {
    x: WorldSpaceCoordinate;
    y: WorldSpaceCoordinate;
    w?: WorldSpaceCoordinate;
    h?: WorldSpaceCoordinate;
}
