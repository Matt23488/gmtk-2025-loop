import type Camera from './Camera';
import { WorldSpaceCoordinate } from './Camera';
import Goal, { type GoalType } from './Goal';
import type Input from './Input';
import Player from './Player';
import type { RenderPass } from './Renderer';
import type Renderer from './Renderer';
import TileSheet, { type TilePiece } from './TileSheet';

const debug = false;

export default class Level {
    #player: Player;
    #dirtTiles: TileSheet;
    #goal: Goal;
    #pauseManager: PauseManager;

    #status: Utils.LoadStatus;
    #width: WorldSpaceCoordinate;
    #height: WorldSpaceCoordinate;
    #mobius: boolean;
    #nextLevel: number | null;
    #startPosition: Geometry.Point<WorldSpaceCoordinate>;
    #goalPosition: Geometry.Point<WorldSpaceCoordinate>;
    #tiles: Tile[];

    constructor(levelNumber: number) {
        this.#player = new Player();
        this.#dirtTiles = new TileSheet('Dirt');
        this.#goal = new Goal();
        this.#pauseManager = new PauseManager();

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
            .then(({ width, height, mobius, nextLevel, goalType, startPosition, goalPosition, tiles }: LevelJson) => {
                this.#status = 'loaded';
                this.#width = width;
                this.#height = height;
                this.#mobius = mobius;
                this.#nextLevel = nextLevel ?? null;
                this.#startPosition = startPosition;
                this.#goalPosition = goalPosition;

                for (const { position: [tileX, tileY], width, height } of tiles) {
                    const w = width ?? 2;
                    const h = height ?? 2;

                    for (let y = 0; y < h; y++) {
                        const pieceY = y === 0 ? 'bottom' : y === h - 1 ? 'top' : '';
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
                
                this.#player.x = startPosition[0];
                this.#player.y = startPosition[1];
                this.#goal.type = goalType;
            })
            .catch(() => this.#status = 'error');
    }

    public get status(): Utils.LoadStatus {
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

    #updatePlayer(deltaTime: number): void {

        let offsetX = WorldSpaceCoordinate.from(this.#player.velocityX * deltaTime);
        let offsetY = WorldSpaceCoordinate.from(this.#player.velocityY * deltaTime + 0.5 * -Level.g * deltaTime * deltaTime);

        const [playerX, playerY] = this.#player.position;
        const [playerWidth, playerHeight] = this.#player.size;

        let newX = playerX + offsetX;
        let newY = playerY + offsetY;

        if (offsetX < 0) {
            let tiles = this.#tiles.map(([x, y]) => [x, y]);
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const collidingTile = tiles
                .filter(([tileX, tileY]) => tileX + 1 <= playerX && tileX + 1 > newX && playerY < tileY + 1 && playerY + playerHeight >= tileY)
                .sort(([ax], [bx]) => bx - ax)[0];

            if (collidingTile) {
                offsetX = WorldSpaceCoordinate.from(collidingTile[0] + 1 - playerX);
                this.#player.velocityX = WorldSpaceCoordinate.from(0);
            }
            
        } else if (offsetX > 0) {
            let tiles = this.#tiles.map(([x, y]) => [x, y]);
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const collidingTile = tiles
                .filter(([tileX, tileY]) => playerX + playerWidth <= tileX && newX + playerWidth > tileX && playerY < tileY + 1 && playerY + playerHeight >= tileY)
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
            let tiles = this.#tiles.map(([x, y]) => [x, y]);
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const collidingTile = tiles
                .filter(([tileX, tileY]) => tileY + 1 <= playerY && tileY + 1 > newY && playerX < tileX + 1 && playerX + playerWidth >= tileX)
                .sort(([,ay], [,by]) => by - ay)[0];

            if (collidingTile) {
                offsetY = WorldSpaceCoordinate.from(collidingTile[1] + 1 - playerY);
                this.#player.velocityY = WorldSpaceCoordinate.from(0);
                this.#player.onGround = true;
            } else {
                this.#player.onGround = false;
            }

        } else if (offsetY > 0) {
            let tiles = this.#tiles.map(([x, y]) => [x, y]);
            if (this.flipped)
                tiles = tiles.map(([x, y]) => [x, WorldSpaceCoordinate.from(this.#height - y - 1)]);

            const collidingTile = tiles
                .filter(([tileX, tileY]) => playerY + playerHeight <= tileY && newY + playerHeight > tileY && playerX < tileX + 1 && playerX + playerWidth >= tileX)
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

        if (this.#player.onGround) {
            if (Math.abs(this.#player.velocityX) > 0.01)
                this.#player.sprite.playAnimation(1);
            else
                this.#player.sprite.playAnimation(0);
        } else
            this.#player.sprite.playAnimation(0);//2);

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
        this.#pauseManager.processInput(input);
        if (this.#pauseManager.paused)
            return;

        this.#player.processInput(input);
        this.#updatePlayer(deltaTime);

        this.#goal.animate(deltaTime);
    }

    render(renderer: Renderer): void {
        this.#renderBackground(renderer);
        this.#renderGround(renderer);
        this.#renderTiles(renderer);
        this.#renderStart(renderer);
        this.#renderGoal(renderer);
        this.#renderPlayer(renderer);
    }

    #renderBackground(renderer: Renderer): void {
        const passes: RenderPass[] = [
            {
                type: 'fill',
                style: 'rgba(51, 46, 41, 1)',
            },
        ];

        if (debug)
            passes.push({
                type: 'stroke',
                style: 'rgb(0, 255, 0)',
                width: 3,
            });

        for (let i = -1; i <= 1; i++)
            renderer.renderRect(
                [
                    WorldSpaceCoordinate.from(-1 + i * this.#width),
                    WorldSpaceCoordinate.from(0),
                ],
                WorldSpaceCoordinate.from(this.#width + 2),
                this.#height,
                { passes }
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

    #renderStart(_renderer: Renderer) {
        // TODO
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
        return (this.#flipped && !copy) || (!this.#flipped && copy && this.#mobius);
    }
}

class PauseManager {
    get paused(): boolean {
        return this.#paused;
    }

    processInput(input: Input) {
        this.#processPauseInput(input.pausePressed);
    }
    
    #paused = false;
    #pauseBtnPressed = false;
    #modal: HTMLDivElement | null = null;

    #processPauseInput(pressed: boolean) {
        if (pressed && !this.#pauseBtnPressed) {
            this.#paused = !this.#paused;

            if (this.#paused) {
                this.#modal = document.createElement('div');
                this.#modal.classList.add('pause');
                this.#modal.textContent = 'Paused';

                document.body.appendChild(this.#modal);
            } else {
                this.#modal!.remove();
                this.#modal = null;
            }
        }

        this.#pauseBtnPressed = pressed;
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
}

interface TileJson {
    position: Geometry.Point<WorldSpaceCoordinate>;
    width?: WorldSpaceCoordinate;
    height?: WorldSpaceCoordinate;
}
