import { getImage } from '../utils';
import { ScreenSpaceCoordinate } from './Camera';

import bg from '/Background.png';

const bgImg = getImage(bg);

export default class Background {
    #position = 0;

    scroll(offset: ScreenSpaceCoordinate) {
        this.#position += offset;
    }

    get image(): CanvasImageSource {
        return bgImg;
    }

    get parallaxOffset(): ScreenSpaceCoordinate {
        return ScreenSpaceCoordinate.from(this.#position);
    }
}
