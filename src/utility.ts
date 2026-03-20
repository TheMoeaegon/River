export const progressBar = (
    current: number,
    total: number,
    width: number = 60,
): string => {
    const percent = current / total;
    const filled = Math.floor(percent * width);
    const empty = width - filled;

    const bar = "#".repeat(filled) + "-".repeat(empty);
    return `[${bar}] ${(percent * 100).toFixed(1)}%`;
};
