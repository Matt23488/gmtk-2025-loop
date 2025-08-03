import Background from './Background';
import type Camera from './Camera';
import { ScreenSpaceCoordinate, WorldSpaceCoordinate } from './Camera';
import Goal, { type GoalType } from './objects/Goal';
import { FlipFlop } from './Input';
import type Input from './Input';
import Player from './Player';
import type Renderer from './Renderer';
import StaticSprite from './objects/StaticSprite';
import TileSheet, { type TilePiece } from './TileSheet';
import Trigger from './objects/Trigger';
import * as TriggerFactory from './objects/TriggerFactory';
import type { TriggerJson } from './objects/Trigger';
import { filterMap } from '../utils';

const startSize = WorldSpaceCoordinate.from(1.75);

export default class Level {
    #player: Player;
    #dirtTiles: TileSheet;
    #start: StaticSprite;
    #goal: Goal;
    #background: Background;
    #debugFlipFlop: FlipFlop;

    #levelNumber: number;
    #status: Utils.LoadStatus;
    #width: WorldSpaceCoordinate;
    #height: WorldSpaceCoordinate;
    #mobius: boolean;
    #nextLevel: number | null;
    #goalPosition: Geometry.Point<WorldSpaceCoordinate>;
    #tiles: Tile[];
    #staticSprites: StaticSprite[];
    #triggers: Trigger[];

    constructor(levelNumber: number) {
        this.#player = new Player();
        this.#dirtTiles = new TileSheet('Dirt');
        this.#start = new StaticSprite('Start');
        this.#goal = new Goal();
        this.#background = new Background();
        this.#debugFlipFlop = new FlipFlop('debug');

        this.#levelNumber = levelNumber;
        this.#status = 'loading';
        this.#width = WorldSpaceCoordinate.from(16);
        this.#height = WorldSpaceCoordinate.from(9);
        this.#mobius = false;
        this.#nextLevel = null;
        this.#goalPosition = [WorldSpaceCoordinate.from(0), WorldSpaceCoordinate.from(-1)];
        this.#tiles = [];
        this.#staticSprites = [];
        this.#triggers = [];

        fetch(`${import.meta.env.BASE_URL}Levels/${levelNumber}.json`)
            .then(r => r.json())
            .then(this.#initialize.bind(this))
            .catch(() => this.#status = 'error');
    }

    get levelNumber(): number {
        return this.#levelNumber;
    }

    get status(): Utils.LoadStatus {
        return this.#status;
    }

    get height(): WorldSpaceCoordinate {
        return this.#height;
    }

    get nextLevel(): number | null {
        return this.#nextLevel;
    }

    get debugEnabled(): boolean {
        return this.#debugFlipFlop.isSet;
    }

    set debugEnabled(enabled: boolean) {
        this.#debugFlipFlop.isSet = enabled;
    }

    #flipped = false;
    get flipped(): boolean {
        return this.#flipped;
    }

    toggleMobius() {
        this.#mobius = !this.#mobius;
        this.#start.mobius = this.#mobius;
        this.#staticSprites.forEach(sprite => sprite.mobius = this.#mobius);
        this.#triggers.forEach(trigger => trigger.mobius = this.#mobius);
    }

    #wrap() {
        if (this.#mobius) {
            this.#flipped = !this.#flipped;
            this.#start.flip();
            this.#staticSprites.forEach(sprite => sprite.flip());
            this.#triggers.forEach(trigger => trigger.flip());
        }
    }

    centerCameraAtPlayer(camera: Camera): void {
        camera.centerAt(this.#player.position[0]);
    }

    #initialize({ width, height, mobius, nextLevel, goalType, startPosition, goalPosition, tiles, staticSprites, triggers }: LevelJson) {

        this.#status = 'loaded';
        this.#width = width;
        this.#height = height;
        this.#mobius = mobius;
        this.#nextLevel = nextLevel ?? null;
        this.#goalPosition = goalPosition;
        this.#flipped = false;

        this.#tiles = [];
        for (const { position: [tileX, tileY], width, height } of tiles) {
            const w = width ?? 2;
            const h = height ?? 2;

            for (let y = 0; y < h; y++) {
                const pieceY = y === h - 1 ? 'top' : y === 0 ? 'bottom' : '';
                for (let x = 0; x < w; x++) {
                    const pieceX = x === 0 ? 'left' : x === w - 1 ? 'right' : '';
                    
                    this.#tiles.push([
                        WorldSpaceCoordinate.from(tileX + x),
                        WorldSpaceCoordinate.from(tileY + y),
                        [pieceY, pieceX].filter(s => !!s).join('-') as any || 'center'
                    ]);
                }
            }
        }

        this.#staticSprites = [];
        for (const [name, x, y, w, h] of staticSprites ?? []) {
            const sprite = new StaticSprite(name);
            sprite.initialize([x, y], [w, h], [width, height], mobius);

            this.#staticSprites.push(sprite);
        }

        this.#triggers = [];
        for (const trigger of triggers ?? []) {
            this.#triggers.push(TriggerFactory.create(trigger, [width, height], mobius));
        }
        
        this.#player.x = startPosition[0];
        this.#player.y = startPosition[1];
        this.#start.initialize(startPosition, [startSize, startSize], [width, height], mobius);
        this.#goal.type = goalType;
    }

    #updatePlayer(deltaTime: number): void {

        let offsetX = WorldSpaceCoordinate.from(this.#player.velocityX * deltaTime);
        let offsetY = WorldSpaceCoordinate.from(this.#player.velocityY * deltaTime + 0.5 * -Level.g * deltaTime * deltaTime);

        const [playerX, playerY] = this.#player.position;
        const [playerWidth, playerHeight] = this.#player.size;

        let newX = playerX + offsetX;
        let newY = playerY + offsetY;

        if (offsetX < 0) {
            let tiles = this.#tiles.map(([x, y]) => [x, y] as Geometry.Point);
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const checkTile = ([tileX, tileY]: Geometry.Point, [playerX, playerY]: Geometry.Point, newX: number) => {
                return tileX + 1 <= playerX && tileX + 1 > newX && playerY < tileY + 1 && playerY + playerHeight >= tileY;
            };

            const filterFn = ([tileX, tileY]: Geometry.Point): Geometry.Point | null => {
                if (checkTile([tileX, tileY], [playerX, playerY], newX))
                    return [tileX, tileY];

                const copyY = this.#mobius ? this.#height - tileY - 1 : tileY;
                if (checkTile([tileX, copyY], [playerX - this.#width, playerY], newX - this.#width))
                    return [tileX + this.#width, tileY];

                if (checkTile([tileX, copyY], [playerX + this.#width, playerY], newX + this.#width))
                    return [tileX - this.#width, tileY];

                return null;
            };

            const collidingTile = filterMap(tiles, filterFn)
                .sort(([ax], [bx]) => bx - ax)[0];

            if (collidingTile) {
                offsetX = WorldSpaceCoordinate.from(collidingTile[0] + 1 - playerX);
                this.#player.velocityX = WorldSpaceCoordinate.from(0);
            }
            
        } else if (offsetX > 0) {
            let tiles = this.#tiles.map(([x, y]) => [x, y] as Geometry.Point);
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const checkTile = ([tileX, tileY]: Geometry.Point, [playerX, playerY]: Geometry.Point, newX: number) =>  {
                return playerX + playerWidth <= tileX && newX + playerWidth > tileX && playerY < tileY + 1 && playerY + playerHeight >= tileY;
            };

            const filterFn = ([tileX, tileY]: Geometry.Point): Geometry.Point | null => {
                if (checkTile([tileX, tileY], [playerX, playerY], newX))
                    return [tileX, tileY];

                const copyY = this.#mobius ? this.#height - tileY - 1 : tileY;
                if (checkTile([tileX, copyY], [playerX - this.#width, playerY], newX - this.#width))
                    return [tileX + this.#width, tileY];

                if (checkTile([tileX, copyY], [playerX + this.#width, playerY], newX + this.#width))
                    return [tileX - this.#width, tileY];

                return null;
            };

            const collidingTile = filterMap(tiles, filterFn)
                .sort(([ax], [bx]) => ax - bx)[0];

            if (collidingTile) {
                offsetX = WorldSpaceCoordinate.from(collidingTile[0] - playerX - playerWidth - 0.01);
                this.#player.velocityX = WorldSpaceCoordinate.from(0);
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
            let tiles = this.#tiles.map(([x, y]) => [x, y] as Geometry.Point);
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const checkTile = ([tileX, tileY]: Geometry.Point, [playerX, playerY]: Geometry.Point) => {
                return tileY + 1 <= playerY && tileY + 1 > newY && playerX < tileX + 1 && playerX + playerWidth >= tileX;
            }

            const filterFn = ([tileX, tileY]: Geometry.Point): Geometry.Point | null => {
                if (checkTile([tileX, tileY], [playerX, playerY]))
                    return [tileX, tileY];

                const copyY = this.#mobius ? this.#height - tileY - 1 : tileY;
                if (checkTile([tileX, copyY], [playerX - this.#width, playerY]))
                    return [tileX + this.#width, copyY];

                if (checkTile([tileX, copyY], [playerX + this.#width, playerY]))
                    return [tileX - this.#width, copyY];

                return null;
            };

            const collidingTile = filterMap(tiles, filterFn)
                .sort(([,ay], [,by]) => by - ay)[0];

            if (collidingTile) {
                offsetY = WorldSpaceCoordinate.from(collidingTile[1] + 1 - playerY);
                this.#player.velocityY = WorldSpaceCoordinate.from(0);
                this.#player.onGround = true;
            } else {
                this.#player.onGround = false;
            }

        } else if (offsetY > 0) {
            let tiles = this.#tiles.map(([x, y]) => [x, y] as Geometry.Point);
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const checkTile = ([tileX, tileY]: Geometry.Point, [playerX, playerY]: Geometry.Point) => {
                return playerY + playerHeight <= tileY && newY + playerHeight > tileY && playerX < tileX + 1 && playerX + playerWidth >= tileX;
            }

            const filterFn = ([tileX, tileY]: Geometry.Point): Geometry.Point | null => {
                if (checkTile([tileX, tileY], [playerX, playerY]))
                    return [tileX, tileY];

                const copyY = this.#mobius ? this.#height - tileY - 1 : tileY;
                if (checkTile([tileX, copyY], [playerX - this.#width, playerY]))
                    return [tileX + this.#width, copyY];

                if (checkTile([tileX, copyY], [playerX + this.#width, playerY]))
                    return [tileX - this.#width, copyY];

                return null;
            };

            const collidingTile = filterMap(tiles, filterFn)
                .sort(([,ay], [,by]) => ay - by)[0];

            if (collidingTile) {
                offsetY = WorldSpaceCoordinate.from(collidingTile[1] - playerY - playerHeight - 0.01);
                this.#player.velocityY = WorldSpaceCoordinate.from(0);
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

        this.#background.scroll(ScreenSpaceCoordinate.from(offsetX * -5));

        if (this.#player.onGround) {
            if (Math.abs(this.#player.velocityX) > 0.01)
                this.#player.sprite.playAnimation(1);
            else
                this.#player.sprite.playAnimation(0);
        } else
            this.#player.sprite.playAnimation(2);

        this.#player.sprite.animate(deltaTime);
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

    static readonly g = 100;
    update(deltaTime: number, input: Input): void {
        this.#processInput(input);
        this.#updatePlayer(deltaTime);

        this.#triggers.forEach(trigger => {
            if (trigger.isActivated(this.#player.position, this.#player.size)) {
                trigger.activate(this);
            }
        });

        this.#goal.animate(deltaTime);
    }

    #processInput(input: Input) {
        this.#debugFlipFlop.processInput(input);
        this.#player.processInput(input);
    }

    render(renderer: Renderer): void {
        this.#renderBackground(renderer);
        this.#renderLoopBoundary(renderer);
        this.#start.render(renderer);
        this.#staticSprites.forEach(sprite => sprite.render(renderer));
        this.#triggers.forEach(trigger => trigger.render(renderer));
        this.#renderGround(renderer);
        this.#renderTiles(renderer);
        this.#renderGoal(renderer);
        this.#renderPlayer(renderer);
    }

    #renderBackground(renderer: Renderer): void {
        renderer.renderBackground(
            this.#background,
            [
                WorldSpaceCoordinate.from(-3 * this.#width),
                WorldSpaceCoordinate.from(0),
            ],
            [
                WorldSpaceCoordinate.from(7 * this.#width),
                this.height,
            ]
        );
    }

    #renderLoopBoundary(renderer: Renderer): void {
        const color = this.#mobius ? 'rgba(255, 0, 255, 0.1)' : 'rgba(0, 255, 0, 0.1)';

        renderer.renderLine(
            [
                WorldSpaceCoordinate.from(0),
                WorldSpaceCoordinate.from(0),
            ],
            [
                WorldSpaceCoordinate.from(0),
                WorldSpaceCoordinate.from(this.height),
            ],
            color,
            10
        );

        renderer.renderLine(
            [
                WorldSpaceCoordinate.from(this.#width),
                WorldSpaceCoordinate.from(0),
            ],
            [
                WorldSpaceCoordinate.from(this.#width),
                WorldSpaceCoordinate.from(this.height),
            ],
            color,
            10
        );
    }

    #renderGround(renderer: Renderer): void {
        // Ground
        for (let i = 0; i < this.#width; i++)
            this.#renderTile(renderer, [
                WorldSpaceCoordinate.from(i),
                WorldSpaceCoordinate.from(0),
                'top',
            ]);

        // Ceiling
        for (let i = 0; i < this.#width; i++)
            this.#renderTile(renderer, [
                WorldSpaceCoordinate.from(i),
                WorldSpaceCoordinate.from(this.#height - 1),
                'bottom',
            ]);
    }

    #renderTiles(renderer: Renderer): void {
        for (const tile of this.#tiles) {
            this.#renderTile(renderer, tile);
        }
    }

    #renderTile(renderer: Renderer, tile: Tile): void {
        const [worldX, worldY, piece] = tile;
        const flippedY = this.height - worldY - 1;
        const flippedPiece = TileSheet.getVerticallyFlippedPiece(piece);

        for (let i = -1; i <= 1; i++)
            renderer.renderTile(
                this.#dirtTiles,
                this.#shouldFlipY(i !== 0) ? flippedPiece : piece,
                [
                    WorldSpaceCoordinate.from(worldX + i * this.#width),
                    WorldSpaceCoordinate.from(this.#shouldFlipY(i !== 0) ? flippedY : worldY),
                ],
                [
                    WorldSpaceCoordinate.from(1),
                    WorldSpaceCoordinate.from(1),
                ]
            );
    }

    #renderGoal(renderer: Renderer) {

        const [worldX, worldY] = this.#goalPosition;

        const flippedY = this.#height - worldY - 1;

        const offsetX = (1 - this.#goal.width) / 2;
        const offsetY = (1 - this.#goal.height) / 2;

        for (let i = -1; i <= 1; i++)
            renderer.renderGoal(
                this.#goal,
                [
                    WorldSpaceCoordinate.from(worldX + i * this.#width + offsetX),
                    WorldSpaceCoordinate.from((this.#shouldFlipY(i !== 0) ? flippedY : worldY) + offsetY),
                ],
                this.#goal.size
            );
    }

    #renderPlayer(renderer: Renderer) {
        renderer.renderSprite(this.#player.sprite, this.#player.position, this.#player.size);
    }

    #shouldFlipY(copy: boolean) {
        return (this.#flipped && !copy) || (!this.#flipped && copy && this.#mobius) || (this.#flipped && !this.#mobius);
    }
}

type Tile = [WorldSpaceCoordinate, WorldSpaceCoordinate, TilePiece];

interface LevelJson {
    width: WorldSpaceCoordinate;
    height: WorldSpaceCoordinate;
    mobius: boolean;
    nextLevel?: number;
    goalType: GoalType;
    startPosition: Geometry.Point<WorldSpaceCoordinate>;
    goalPosition: Geometry.Point<WorldSpaceCoordinate>;
    tiles: TileJson[];
    staticSprites?: TriggerJson[];
    triggers?: TriggerJson[];
}

interface TileJson {
    position: Geometry.Point<WorldSpaceCoordinate>;
    width?: WorldSpaceCoordinate;
    height?: WorldSpaceCoordinate;
}
