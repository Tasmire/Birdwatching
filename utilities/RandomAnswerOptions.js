export function RandomAnswerOptions(allData, correctAnswer, count = 4) {
    const answers = allData.map(item => item[correctAnswer]).filter(name => name !== correctAnswer);
    const shuffled = answers.sort(() => 0.5 - Math.random()).slice(0, count - 1);
    shuffled.push(correctAnswer);
    return shuffled.sort(() => 0.5 - Math.random());
}