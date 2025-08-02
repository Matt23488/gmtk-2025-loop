import { WorldSpaceCoordinate } from '../../Camera';
import type Level from '../../Level';
import StaticSprite from '../StaticSprite';
import Trigger from '../Trigger';

export default class MobiusToggleTrigger extends Trigger {
    constructor(position: Geometry.Point<WorldSpaceCoordinate>, size: Geometry.Point<WorldSpaceCoordinate>, levelSize: Geometry.Point<WorldSpaceCoordinate>, mobius: boolean) {
        const sprite = new StaticSprite('Rock');
        sprite.initialize(position, size, levelSize, mobius);

        super(sprite);
    }

    activate(level: Level): void {
        level.toggleMobius();
        this.position[1] = WorldSpaceCoordinate.from(this.position[1] - this.size[1] * 0.1);

        super.activate(level);
    }
}
