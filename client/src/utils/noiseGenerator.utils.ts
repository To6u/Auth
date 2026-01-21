export function generateNoiseDataURL(
    size: number = 200,
    opacity: number = 0.08
): string {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Генерируем случайный шум для каждого пикселя
    for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise;           // R
        data[i + 1] = noise;       // G
        data[i + 2] = noise;       // B
        data[i + 3] = opacity * 255; // A
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

// Опционально: более сложный шум с Perlin-like эффектом
export function generatePerlinNoiseDataURL(
    size: number = 200,
    opacity: number = 0.08,
    scale: number = 50
): string {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;

            // Простая имитация Perlin noise
            const noise =
                Math.sin(x / scale) * Math.cos(y / scale) * 127 +
                Math.random() * 128;

            const value = Math.floor(noise);
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
            data[i + 3] = opacity * 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}