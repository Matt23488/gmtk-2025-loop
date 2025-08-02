export function getImage(url: string, onload = () => {}): HTMLImageElement {
    const img = new Image();
    img.src = url;
    img.onload = onload;

    return img;
}
