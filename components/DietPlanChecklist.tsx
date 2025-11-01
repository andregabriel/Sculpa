import React from 'react';
import { parseDietPlan } from '../utils/dietParser';

interface DietPlanChecklistProps {
  planText: string;
  intakeText: string;
  onToggleItem: (itemText: string, isChecked: boolean) => void;
  isReadOnly: boolean;
}

const DietPlanChecklist: React.FC<DietPlanChecklistProps> = ({ planText, intakeText, onToggleItem, isReadOnly }) => {
  const meals = parseDietPlan(planText);
  // Create a Set of trimmed lines for efficient lookup
  const consumedItems = new Set(intakeText.split('\n').map(line => line.trim()));

  if (meals.length === 0) {
    return <p className="text-sm text-slate-500 p-4 bg-slate-100 rounded-lg">O plano de dieta está vazio. Edite o plano para adicionar refeições e itens.</p>;
  }

  return (
    <div className="space-y-4 p-2">
      {meals.map((meal, mealIndex) => (
        <div key={mealIndex} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-3">{meal.name}</h4>
          <ul className="space-y-3">
            {meal.items.map((item, itemIndex) => {
              const isChecked = consumedItems.has(item.text);
              return (
                <li key={itemIndex} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`item-${mealIndex}-${itemIndex}`}
                    checked={isChecked}
                    onChange={() => onToggleItem(item.text, !isChecked)}
                    disabled={isReadOnly}
                    className="h-5 w-5 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
                  />
                  <label
                    htmlFor={`item-${mealIndex}-${itemIndex}`}
                    className={`ml-3 text-slate-700 w-full ${isChecked ? 'line-through text-slate-400' : ''} ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {item.text.replace(/^- /, '')}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default DietPlanChecklist;
