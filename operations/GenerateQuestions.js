const generateRandomQuestions = (bird) => {
    const infoTypes = ["Maori Name", "Scientific Name", "Average Size", "Habitat", "Diet", "Origin"];
    const randomQuestions = infoTypes.map((infoType) => ({
        question: `What is the ${infoType.toLowerCase()} of this bird?`,
        correctAnswer: bird[infoType],
    }));

    return randomQuestions.sort(() => 0.5 - Math.random());
};

export default generateRandomQuestions;