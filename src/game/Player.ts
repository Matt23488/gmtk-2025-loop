import { WorldSpaceCoordinate } from './Camera';
import type Input from './Input';
import Sprite from './Sprite';

export default class Player {
    #sprite: Sprite;
    #size: Geometry.Point<WorldSpaceCoordinate>;
    #position: Geometry.Point<WorldSpaceCoordinate>;
    #velocity: Geometry.Point<WorldSpaceCoordinate>;

    constructor() {
        this.#sprite = new Sprite('Cass');
        this.#size = [WorldSpaceCoordinate.from(1), WorldSpaceCoordinate.from(1)];
        this.#position = [WorldSpaceCoordinate.from(0), WorldSpaceCoordinate.from(0)];
        this.#velocity = [WorldSpaceCoordinate.from(0), WorldSpaceCoordinate.from(0)];
    }

    get sprite(): Sprite {
        return this.#sprite;
    }

    get size(): Geometry.Point<WorldSpaceCoordinate> {
        return this.#size;
    }

    get width(): WorldSpaceCoordinate {
        return this.#size[0];
    }

    get height(): WorldSpaceCoordinate {
        return this.#size[1];
    }

    get position(): Geometry.Point<WorldSpaceCoordinate> {
        return this.#position;
    }

    get x(): WorldSpaceCoordinate {
        return this.#position[0];
    }

    set x(x: WorldSpaceCoordinate) {
        this.#position[0] = x;
    }

    get y(): WorldSpaceCoordinate {
        return this.#position[1];
    }

    set y(y: WorldSpaceCoordinate) {
        this.#position[1] = y;
    }

    get velocity(): Geometry.Point<WorldSpaceCoordinate> {
        return this.#velocity;
    }

    get velocityX(): WorldSpaceCoordinate {
        return this.#velocity[0];
    }

    set velocityX(velocityX: WorldSpaceCoordinate) {
        this.#velocity[0] = velocityX;
    }

    get velocityY(): WorldSpaceCoordinate {
        return this.#velocity[1];
    }

    set velocityY(velocityY: WorldSpaceCoordinate) {
        this.#velocity[1] = velocityY;
    }

    static readonly #movementVelocity = 10;
    #moveLeft() {
        this.velocityX = WorldSpaceCoordinate.from(-Player.#movementVelocity);
        this.#sprite.flipHorizontal = true;
    }

    #moveRight() {
        this.velocityX = WorldSpaceCoordinate.from(Player.#movementVelocity);
        this.#sprite.flipHorizontal = false;
    }

    onGround = false;
    #jump() {
        if (!this.onGround)
            return;

        this.onGround = false;
        this.velocityY = WorldSpaceCoordinate.from(10);
    }

    processInput(input: Input) {
        if (input.leftPressed)
            this.#moveLeft();

        if (input.rightPressed)
            this.#moveRight();

        if (input.jumpPressed)
            this.#jump();
    }
}
