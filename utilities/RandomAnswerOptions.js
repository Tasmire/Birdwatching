export function RandomAnswerOptions(allData, propKey, correctAnswer, count = 4) {
    const values = Array.from(new Set(
        (allData || [])
            .map(item => {
                // defensive access: try property as-is, fallback to common casings
                return item?.[propKey] ?? item?.[propKey.charAt(0).toLowerCase() + propKey.slice(1)] ?? item?.[propKey.charAt(0).toUpperCase() + propKey.slice(1)];
            })
            .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
    ));

    // remove correct answer from distractors if present
    const filtered = values.filter(v => String(v) !== String(correctAnswer));

    // shuffle helper
    const shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const picks = shuffle(filtered).slice(0, Math.max(0, count - 1));
    // ensure correct answer present
    const combined = [...picks, correctAnswer];
    return shuffle(combined);
}