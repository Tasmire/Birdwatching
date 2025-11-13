import { apiCallPost } from './ApiCalls';

export async function evaluateAchievements(userId, animalId = null, token = null, eventType = 'Generic') {
    if (!userId) return null;
    const payload = { UserId: userId, EventType: eventType };
    if (animalId) payload.AnimalId = animalId;

    try {
        const res = await apiCallPost(`/api/AchievementEvaluation/evaluate`, token, payload);
        return res || null;
    } catch (err) {
        console.warn('evaluateAchievements error', err);
        return null;
    }
}