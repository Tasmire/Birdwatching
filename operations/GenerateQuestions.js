import { RandomAnswerOptions } from '../utilities/RandomAnswerOptions';

const infoFields = [
    { prop: 'name', label: 'name' },
    { prop: 'maoriName', label: 'Maori name' },
    { prop: 'scientificName', label: 'scientific name' },
    { prop: 'averageSize', label: 'average size' },
    { prop: 'habitat', label: 'habitat' },
    { prop: 'diet', label: 'diet' },
    { prop: 'origin', label: 'origin' },
];

const getFieldValue = (obj, key) => {
    if (!obj || !key) return undefined;
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    return obj[key] ?? obj[camel] ?? obj[pascal];
}

// const generateRandomQuestions = (bird) => {
//     const infoTypes = ["Maori Name", "Scientific Name", "Average Size", "Habitat", "Diet", "Origin"];
//     const randomQuestions = infoTypes.map((infoType) => ({
//         question: `What is the ${infoType.toLowerCase()} of this bird?`,
//         correctAnswer: bird[infoType],
//     }));

//     return randomQuestions.sort(() => 0.5 - Math.random());
// };

const generateRandomQuestions = (bird, allBirds = []) => {
    if (!bird) return [];
    
    const qs = infoFields.map(field => {
        const correctRaw = getFieldValue(bird, field.prop);
        if (correctRaw === undefined || correctRaw === null || String(correctRaw).trim() === '') return null;
        const correct = String(correctRaw);

        const answerOptions = RandomAnswerOptions(allBirds, field.prop, correct, 4);
        return {
            question: `What is the ${field.label} of this bird?`,
            infoType: field.prop,
            correctAnswer: correct,
            answerOptions: answerOptions,
        };
    }).filter(Boolean);

    return qs.sort(() => 0.5 - Math.random());
};

export default generateRandomQuestions;