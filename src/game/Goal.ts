import friendPng from '/Goal/Friend.png';
import strangersWingPng from '/Goal/StrangersWing.png';
import seedPng from '/Goal/Seed.png';
import { WorldSpaceCoordinate } from './Camera';
import { getImage } from '../utils';
import { TypeExhaustionError } from '../utils/Errors';

export default class Goal {
    type: GoalType = 'friend';

    animate(deltaTime: number) {
        let animationDeltaTime = this.#animationDeltaTime + deltaTime;
        if (animationDeltaTime > duration)
            animationDeltaTime = 0;

        this.#animationDeltaTime = animationDeltaTime;
    }

    get image(): CanvasImageSource {
        switch (this.type) {
            case 'friend': return friendImg;
            case 'strangers-wing': return strangersWingImg;
            case 'seed': return seedImg;
            default:
                throw new TypeExhaustionError('GoalType', this.type);
        }
    }

    get size(): Geometry.Point<WorldSpaceCoordinate> {
        return [width, height];
    }

    get width(): WorldSpaceCoordinate {
        return width;
    }

    get height(): WorldSpaceCoordinate {
        return height;
    }

    offset([x, y]: Geometry.Point<WorldSpaceCoordinate>): Geometry.Point<WorldSpaceCoordinate> {
        const t = this.#animationDeltaTime / duration * Math.PI * 2;
        const yOffset = Math.sin(t) * amplitude;

        return [
            x,
            WorldSpaceCoordinate.from(y + yOffset),
        ];
    }

    #animationDeltaTime = 0;
}

export type GoalType = 'friend' | 'strangers-wing' | 'seed';

const size = 1;
const width = WorldSpaceCoordinate.from(size);
const height = WorldSpaceCoordinate.from(size);

// animation
const duration = 2; // seconds
const amplitude = 0.1; // world space

// image
const friendImg = getImage(friendPng);
const strangersWingImg = getImage(strangersWingPng);
const seedImg = getImage(seedPng);
