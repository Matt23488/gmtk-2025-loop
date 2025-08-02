import type { WorldSpaceCoordinate } from '../Camera';
import type Trigger from './Trigger';
import type { TriggerJson } from './Trigger';
import MobiusToggleTrigger from './Triggers/MobiusToggleTrigger';

export function create([name, x, y, w, h]: TriggerJson, levelSize: Geometry.Point<WorldSpaceCoordinate>, mobius: boolean): Trigger {
    switch (name) {
        case 'mobius-toggle': return new MobiusToggleTrigger([x, y], [w, h], levelSize, mobius);
        default: throw new Error(`No trigger named ${name}`);
    }
}
