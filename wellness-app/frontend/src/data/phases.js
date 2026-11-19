// Cycle-sync food ideas. "a" lists allergens so we can filter by the user's allergies.
// Wellness awareness only, not medical advice.

export const phaseOrder = ["menstrual", "follicular", "ovulation", "luteal"];

export const phases = {
  menstrual: {
    label: "Menstrual phase",
    short: "Menstrual",
    when: "During your period",
    color: "text-rose-500",
    bg: "bg-rose-50",
    dot: "bg-rose-400",
    intro: "Comforting, warm and iron-rich meals can feel good right now.",
    foods: [
      { n: "Palak dal", a: [] },
      { n: "Jaggery & dates", a: [] },
      { n: "Methi paratha", a: ["Gluten"] },
      { n: "Til laddoo", a: ["Sesame"] },
      { n: "Ragi porridge", a: [] },
      { n: "Rajma or chole", a: [] },
    ],
  },
  follicular: {
    label: "Follicular phase",
    short: "Follicular",
    when: "After your period, before ovulation",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    dot: "bg-emerald-400",
    intro: "Energy is often rising. Fresh, light and protein-rich meals fit well.",
    foods: [
      { n: "Moong sprouts salad", a: [] },
      { n: "Moong dal chilla", a: [] },
      { n: "Ragi dosa", a: [] },
      { n: "Curd with seasonal fruit", a: ["Dairy"] },
      { n: "Vegetable poha", a: [] },
      { n: "Idli with sambar", a: [] },
    ],
  },
  ovulation: {
    label: "Ovulation window",
    short: "Ovulation",
    when: "Around the middle of your cycle",
    color: "text-amber-500",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
    intro: "Hydrating, fibre-rich foods are a lovely choice around now.",
    foods: [
      { n: "Coconut water", a: [] },
      { n: "Cucumber raita", a: ["Dairy"] },
      { n: "Mixed dal & vegetables", a: [] },
      { n: "Fruit bowl", a: [] },
      { n: "Almonds & raisins", a: ["Tree nuts"] },
      { n: "Vegetable salad", a: [] },
    ],
  },
  luteal: {
    label: "Luteal phase",
    short: "Luteal",
    when: "The days before your next period",
    color: "text-lav-600",
    bg: "bg-lav-50",
    dot: "bg-lav-400",
    intro: "Steady, complex carbs and magnesium-rich foods can help you feel balanced.",
    foods: [
      { n: "Bajra roti with sabzi", a: [] },
      { n: "Ragi malt", a: [] },
      { n: "Banana", a: [] },
      { n: "Pumpkin seeds", a: [] },
      { n: "Peanut chikki", a: ["Peanuts"] },
      { n: "Curd rice", a: ["Dairy"] },
    ],
  },
};