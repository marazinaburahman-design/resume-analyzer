import { ROLES } from './roles.js';
export function fallbackAnalysis(text, targetRole) {
 const found = ROLES[targetRole].filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
 const missing = ROLES[targetRole].filter(skill => !found.includes(skill));
 const fixes = missing.slice(0, 3).map(skill => `Add a project that demonstrates ${skill}.`);
 while (fixes.length < 3) fixes.push('Add measurable outcomes to your project descriptions, such as users, speed, or time saved.');
 return { score: null, verdict: 'AI is busy, showing a skill match only', skillsFound: found, skillsMissing: missing, topFixes: fixes, fallback: true };
}
