export interface ParsedFoodItem {
  text: string; // The full line, e.g., "- 2 fatias de pão"
}

export interface ParsedMeal {
  name: string;
  items: ParsedFoodItem[];
}

export const parseDietPlan = (planText: string): ParsedMeal[] => {
  if (!planText || !planText.trim()) {
    return [];
  }

  const lines = planText.split('\n').filter(line => line.trim() !== '');
  const meals: ParsedMeal[] = [];
  let currentMeal: ParsedMeal | null = null;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    // Check if the line is a food item (starts with a dash)
    if (trimmedLine.startsWith('-')) {
      // If it's the first item and there's no meal yet, create a default one
      if (!currentMeal) {
        currentMeal = { name: 'Refeição Geral', items: [] };
        meals.push(currentMeal);
      }
      currentMeal.items.push({ text: trimmedLine });
    } else {
      // It's a meal header
      // If the last meal had no items, this new header overwrites it
      if (currentMeal && currentMeal.items.length === 0) {
        meals.pop();
      }
      currentMeal = { name: trimmedLine.replace(/#+\s*/, ''), items: [] };
      meals.push(currentMeal);
    }
  });

  return meals.filter(meal => meal.items.length > 0);
};
