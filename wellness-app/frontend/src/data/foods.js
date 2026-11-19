// Starter Indian food dataset. Values are APPROXIMATE, per one listed serving.
// Replace/extend with your real Indian food dataset later (we'll load it from MySQL via FastAPI).
//
// diet: "vegan" | "veg" | "egg" | "nonveg"
// protein, carbs, fat are in grams. iron is in mg.

const f = (
  id,
  name,
  alt,
  category,
  diet,
  serving,
  protein,
  carbs,
  fat,
  iron,
  allergens = []
) => ({ id, name, alt, category, diet, serving, protein, carbs, fat, iron, allergens });

export const categories = [
  "Breakfast",
  "Rotis & Rice",
  "Dals & Curries",
  "Snacks",
  "Fruits",
  "Drinks & Dairy",
  "Sweets",
  "Non-veg",
];

export const foods = [
  // ---------- Breakfast ----------
  f("idli", "Idli", "steamed rice cake", "Breakfast", "vegan", "2 pieces", 4, 24, 0.5, 1.0),
  f("dosa", "Plain dosa", "sada dosa", "Breakfast", "vegan", "1 dosa", 3, 22, 3.5, 0.8),
  f("masala-dosa", "Masala dosa", "dosa with potato", "Breakfast", "vegan", "1 dosa", 5, 38, 8, 1.5),
  f("ragi-dosa", "Ragi dosa", "finger millet dosa", "Breakfast", "vegan", "1 dosa", 3, 22, 2.5, 1.5),
  f("upma", "Upma", "rava upma", "Breakfast", "vegan", "1 katori", 5, 30, 7, 1.5, ["Gluten"]),
  f("poha", "Poha", "flattened rice", "Breakfast", "vegan", "1 plate", 5, 40, 8, 2.5, ["Peanuts"]),
  f("moong-chilla", "Moong dal chilla", "pesarattu", "Breakfast", "vegan", "1 chilla", 7, 14, 4, 1.5),
  f("besan-chilla", "Besan chilla", "gram flour pancake", "Breakfast", "vegan", "1 chilla", 6, 15, 5, 1.5),
  f("aloo-paratha", "Aloo paratha", "potato paratha", "Breakfast", "veg", "1 paratha", 5, 36, 10, 1.5, ["Gluten", "Dairy"]),
  f("methi-paratha", "Methi paratha", "fenugreek paratha", "Breakfast", "veg", "1 paratha", 5, 28, 8, 2.0, ["Gluten"]),
  f("oats-milk", "Oats porridge (with milk)", "oatmeal", "Breakfast", "veg", "1 bowl", 6, 30, 4, 2.0, ["Dairy"]),
  f("ragi-malt", "Ragi porridge / malt", "ragi java, finger millet", "Breakfast", "vegan", "1 glass", 3, 26, 1, 2.0),
  f("boiled-egg", "Boiled egg", "ande", "Breakfast", "egg", "1 egg", 6, 0.5, 5, 0.9, ["Eggs"]),

  // ---------- Rotis & Rice ----------
  f("roti", "Roti / Chapati", "phulka", "Rotis & Rice", "vegan", "1 roti", 3, 18, 2, 1.0, ["Gluten"]),
  f("bajra-roti", "Bajra roti", "pearl millet roti", "Rotis & Rice", "vegan", "1 roti", 3.5, 22, 2.5, 2.5),
  f("jowar-roti", "Jowar roti", "sorghum roti, jolada rotti", "Rotis & Rice", "vegan", "1 roti", 3, 22, 1, 1.5),
  f("ragi-roti", "Ragi roti", "finger millet roti", "Rotis & Rice", "vegan", "1 roti", 3, 24, 1, 2.0),
  f("kuttu-roti", "Kuttu roti", "buckwheat roti", "Rotis & Rice", "vegan", "1 roti", 3, 20, 2, 1.5),
  f("rice", "Steamed rice", "chawal, annam", "Rotis & Rice", "vegan", "1 katori", 4, 44, 0.5, 0.5),
  f("brown-rice", "Brown rice", "", "Rotis & Rice", "vegan", "1 katori", 4, 39, 1.5, 0.8),
  f("jeera-rice", "Jeera rice", "cumin rice", "Rotis & Rice", "veg", "1 katori", 4, 42, 5, 0.7),
  f("veg-pulao", "Veg pulao", "vegetable pulao", "Rotis & Rice", "veg", "1 katori", 5, 40, 7, 1.2),
  f("curd-rice", "Curd rice", "thayir sadam, perugu annam", "Rotis & Rice", "veg", "1 katori", 6, 36, 5, 0.5, ["Dairy"]),
  f("lemon-rice", "Lemon rice", "chitranna", "Rotis & Rice", "vegan", "1 katori", 4, 40, 6, 1.0, ["Peanuts"]),
  f("khichdi", "Moong dal khichdi", "", "Rotis & Rice", "veg", "1 bowl", 8, 32, 4, 1.8),
  f("veg-biryani", "Veg biryani", "", "Rotis & Rice", "veg", "1 plate", 8, 58, 12, 1.5, ["Dairy"]),

  // ---------- Dals & Curries ----------
  f("dal-tadka", "Dal tadka", "toor dal", "Dals & Curries", "vegan", "1 katori", 8, 20, 4, 2.5),
  f("moong-dal", "Moong dal", "yellow dal", "Dals & Curries", "vegan", "1 katori", 8, 19, 2.5, 2.0),
  f("sambar", "Sambar", "", "Dals & Curries", "vegan", "1 katori", 5, 15, 2.5, 2.0),
  f("rajma", "Rajma", "kidney beans curry", "Dals & Curries", "vegan", "1 katori", 9, 28, 4, 3.0),
  f("chole", "Chole", "chana masala", "Dals & Curries", "vegan", "1 katori", 9, 30, 6, 3.5),
  f("palak-dal", "Palak dal", "spinach dal", "Dals & Curries", "vegan", "1 katori", 8, 18, 4, 3.5),
  f("palak-paneer", "Palak paneer", "spinach & paneer", "Dals & Curries", "veg", "1 katori", 10, 8, 17, 3.0, ["Dairy"]),
  f("paneer-curry", "Paneer curry", "paneer butter masala", "Dals & Curries", "veg", "1 katori", 12, 8, 20, 1.5, ["Dairy"]),
  f("mixed-veg", "Mixed vegetable curry", "sabzi", "Dals & Curries", "vegan", "1 katori", 3, 12, 6, 1.2),
  f("aloo-gobi", "Aloo gobi", "potato cauliflower", "Dals & Curries", "vegan", "1 katori", 3, 18, 6, 1.0),
  f("bhindi", "Bhindi fry", "okra / ladies finger", "Dals & Curries", "vegan", "1 katori", 2.5, 10, 7, 0.8),

  // ---------- Snacks ----------
  f("sprouts", "Sprouts salad", "moong sprouts", "Snacks", "vegan", "1 bowl", 9, 20, 1, 2.5),
  f("roasted-chana", "Roasted chana", "bhuna chana", "Snacks", "vegan", "1 handful (30g)", 6, 17, 2, 1.5),
  f("makhana", "Roasted makhana", "fox nuts, phool makhana", "Snacks", "vegan", "1 bowl (30g)", 3.5, 22, 0.5, 0.5),
  f("samosa", "Samosa", "", "Snacks", "vegan", "1 piece", 4, 28, 15, 1.2, ["Gluten"]),
  f("chikki", "Peanut chikki", "groundnut jaggery bar", "Snacks", "vegan", "1 piece (30g)", 4, 17, 7, 0.6, ["Peanuts"]),
  f("til-laddoo", "Til laddoo", "sesame jaggery ball", "Snacks", "vegan", "1 laddoo", 2.5, 14, 6, 1.5, ["Sesame"]),
  f("mixed-nuts", "Mixed nuts", "almonds, cashews", "Snacks", "vegan", "1 handful (30g)", 5, 6, 16, 1.2, ["Tree nuts"]),
  f("sabudana-khichdi", "Sabudana khichdi", "sago", "Snacks", "vegan", "1 plate", 3, 52, 9, 1.0, ["Peanuts"]),

  // ---------- Fruits ----------
  f("banana", "Banana", "kela, arati pandu", "Fruits", "vegan", "1 medium", 1.3, 27, 0.4, 0.3),
  f("apple", "Apple", "seb", "Fruits", "vegan", "1 medium", 0.5, 25, 0.3, 0.2),
  f("orange", "Orange / Mosambi", "citrus", "Fruits", "vegan", "1 fruit", 1.3, 16, 0.2, 0.2),
  f("papaya", "Papaya", "papita", "Fruits", "vegan", "1 bowl", 1, 15, 0.3, 0.3),
  f("guava", "Guava", "amrood, jama", "Fruits", "vegan", "1 medium", 2.5, 14, 1, 0.3),
  f("pomegranate", "Pomegranate", "anar, dalimma", "Fruits", "vegan", "1 small bowl", 1.5, 18, 1, 0.3),
  f("dates", "Dates", "khajur", "Fruits", "vegan", "3 pieces", 0.5, 18, 0, 0.5),

  // ---------- Drinks & Dairy ----------
  f("milk", "Milk", "doodh", "Drinks & Dairy", "veg", "1 glass (200ml)", 6.5, 10, 7, 0.1, ["Dairy"]),
  f("chaas", "Buttermilk", "chaas, majjiga", "Drinks & Dairy", "veg", "1 glass", 2, 3, 1.5, 0.1, ["Dairy"]),
  f("coconut-water", "Coconut water", "nariyal pani", "Drinks & Dairy", "vegan", "1 glass", 1.5, 9, 0.5, 0.3),
  f("chai", "Masala chai (milk & sugar)", "tea", "Drinks & Dairy", "veg", "1 cup", 2, 12, 3, 0.1, ["Dairy"]),
  f("curd", "Curd / Dahi", "yogurt, perugu", "Drinks & Dairy", "veg", "1 katori", 6, 7, 5, 0.1, ["Dairy"]),
  f("raita", "Cucumber raita", "", "Drinks & Dairy", "veg", "1 katori", 4, 6, 4, 0.1, ["Dairy"]),

  // ---------- Sweets ----------
  f("jaggery", "Jaggery", "gud, bellam", "Sweets", "vegan", "1 small piece (10g)", 0, 9.5, 0, 1.0),
  f("gulab-jamun", "Gulab jamun", "", "Sweets", "veg", "1 piece", 2, 22, 6, 0.2, ["Dairy", "Gluten"]),
  f("kheer", "Kheer", "payasam", "Sweets", "veg", "1 katori", 5, 30, 7, 0.2, ["Dairy"]),

  // ---------- Non-veg ----------
  f("egg-curry", "Egg curry", "", "Non-veg", "egg", "1 katori (2 eggs)", 13, 6, 16, 1.8, ["Eggs"]),
  f("chicken-curry", "Chicken curry", "", "Non-veg", "nonveg", "1 katori", 22, 6, 14, 1.3),
  f("fish-curry", "Fish curry", "", "Non-veg", "nonveg", "1 katori", 20, 5, 11, 1.0, ["Seafood"]),
  f("mutton-curry", "Mutton curry", "", "Non-veg", "nonveg", "1 katori", 24, 5, 18, 2.5),
  f("chicken-biryani", "Chicken biryani", "", "Non-veg", "nonveg", "1 plate", 22, 55, 15, 2.0, ["Dairy"]),
];

export const foodById = Object.fromEntries(foods.map((x) => [x.id, x]));

// Which foods are OK for a user's chosen diet
export const dietAllowed = (userDiet, foodDiet) => {
  if (!userDiet || userDiet === "non-vegetarian") return true;
  if (userDiet === "vegan") return foodDiet === "vegan";
  if (userDiet === "vegetarian") return foodDiet === "vegan" || foodDiet === "veg";
  if (userDiet === "eggetarian")
    return foodDiet === "vegan" || foodDiet === "veg" || foodDiet === "egg";
  return true;
};