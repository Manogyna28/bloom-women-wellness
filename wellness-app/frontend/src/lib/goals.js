import { getDefaultGoals } from "./storage.js";

// Suggested daily goals.
// - Water: about 33 ml per kg of body weight, rounded to 250 ml glasses (kept between 6 and 14).
// - Sleep & activity: based on age-group guidelines (not on weight or BMI).
// Weight is optional. Without it we use the standard 8 glasses.
export const suggestGoals = (ageRange, weightKg) => {
  const base = getDefaultGoals(ageRange);
  const w = Number(weightKg);
  if (!w || w < 25 || w > 200) return base;
  const glasses = Math.round((w * 33) / 250);
  return { ...base, water: Math.min(14, Math.max(6, glasses)) };
};