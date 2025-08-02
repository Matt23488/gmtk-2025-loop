export function getImage(url: string, onload = () => {}): HTMLImageElement {
    const img = document.createElement('img');
    img.src = url;
    img.onload = onload;

    return img;
}
