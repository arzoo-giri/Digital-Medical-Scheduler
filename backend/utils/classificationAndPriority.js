const SYMPTOMS_DATA = {
  fever: { General_Illness: 0.8, Flu: 0.5, Severe_Infection: 0.3, Priority_Score: 4, Specialty: 'General physician' },
  headache: { General_Illness: 0.6, Flu: 0.4, Severe_Infection: 0.7, Priority_Score: 5, Specialty: 'Neurologist' },
  chest_pain: { General_Illness: 0.1, Flu: 0.05, Severe_Infection: 0.95, Priority_Score: 10, Specialty: 'General physician' },
  difficulty_breathing: { General_Illness: 0.4, Flu: 0.6, Severe_Infection: 0.9, Priority_Score: 15, Specialty: 'General physician' },
  sore_throat: { General_Illness: 0.7, Flu: 0.9, Severe_Infection: 0.2, Priority_Score: 2, Specialty: 'General physician' },
  stomach_pain: { General_Illness: 0.2, Flu: 0.1, Severe_Infection: 0.8, Priority_Score: 7, Specialty: 'Gastroenterologist' },
  skin_rash: { General_Illness: 0.1, Flu: 0.05, Severe_Infection: 0.3, Priority_Score: 3, Specialty: 'Dermatologist' },
  pregnancy_symptoms: { General_Illness: 0.01, Flu: 0.01, Severe_Infection: 0.01, Priority_Score: 1, Specialty: 'Gynecologist' },
  child_fever: { General_Illness: 0.1, Flu: 0.1, Severe_Infection: 0.1, Priority_Score: 5, Specialty: 'Pediatricians' }
};

const PRIOR_PROBABILITIES = { General_Illness: 1 / 3, Flu: 1 / 3, Severe_Infection: 1 / 3 };

function classifyCondition(symptoms) {
  let maxLogProb = -Infinity;
  let finalDiagnosis = 'General_Illness';
  let suggestedSpecialty = 'General physician';

  const allClasses = Object.keys(PRIOR_PROBABILITIES);
  const allSymptoms = Object.keys(SYMPTOMS_DATA);

  for (const className of allClasses) {
    let logProb = Math.log(PRIOR_PROBABILITIES[className]);
    for (const symptom of allSymptoms) {
      const hasSymptom = symptoms.includes(symptom);
      const prob = SYMPTOMS_DATA[symptom][className] || 0.001;
      logProb += Math.log(hasSymptom ? prob : 1 - prob);
    }
    if (logProb > maxLogProb) {
      maxLogProb = logProb;
      finalDiagnosis = className;
    }
  }

  const specialties = symptoms
    .map((s) => SYMPTOMS_DATA[s]?.Specialty)
    .filter(Boolean);

  if (specialties.length > 0) {
    const counts = specialties.reduce((acc, sp) => {
      acc[sp] = (acc[sp] || 0) + 1;
      return acc;
    }, {});
    suggestedSpecialty = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
  }

  return { diagnosis: finalDiagnosis, specialty: suggestedSpecialty };
}

function calculatePriorityScore(symptoms) {
  return symptoms.reduce((score, s) => score + (SYMPTOMS_DATA[s]?.Priority_Score || 0), 0);
}

function generateAvailableSlots(doctor, date) {
  const slots = [];
  if (!doctor.workingHours) return slots;

  const { start, end, slotDuration } = doctor.workingHours; 
  const startParts = start.split(":").map(Number);
  const endParts = end.split(":").map(Number);

  let currentMinutes = startParts[0] * 60 + startParts[1];
  const endMinutes = endParts[0] * 60 + endParts[1];

  const bookedSlots = doctor.slots_booked?.[date] || [];

  while (currentMinutes + slotDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
    const minutes = (currentMinutes % 60).toString().padStart(2, "0");
    const slot = `${hours}:${minutes}`;
    if (!bookedSlots.includes(slot)) slots.push(slot);
    currentMinutes += slotDuration;
  }

  return slots;
}

export { classifyCondition, calculatePriorityScore, generateAvailableSlots };
