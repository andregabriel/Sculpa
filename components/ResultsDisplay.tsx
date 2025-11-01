
import React from 'react';
import type { AnalysisResult, Totals, Meal } from '../types';

interface DataTableProps {
  title: string;
  meals: Meal[];
  totals: Totals;
}

const DataTable: React.FC<DataTableProps> = ({ title, meals, totals }) => (
  <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
    <h3 className="text-xl font-bold mb-4 text-indigo-600">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left table-auto">
        <thead className="border-b-2 border-slate-200 text-slate-500">
          <tr>
            <th className="p-3 font-semibold">Alimento / Refeição</th>
            <th className="p-3 font-semibold text-right">Calorias (kcal)</th>
            <th className="p-3 font-semibold text-right">Proteínas (g)</th>
            <th className="p-3 font-semibold hidden md:table-cell">Fonte</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal, mealIndex) => (
            <React.Fragment key={mealIndex}>
              <tr className="bg-slate-100">
                <td colSpan={4} className="p-2 font-bold text-slate-700">
                  {meal.name}
                </td>
              </tr>
              {meal.items.map((item, itemIndex) => (
                <tr key={itemIndex} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3 pl-6 font-medium">{item.food}</td>
                  <td className="p-3 text-right">{item.calories.toFixed(1)}</td>
                  <td className="p-3 text-right">{item.protein.toFixed(1)}</td>
                  <td className="p-3 text-xs text-slate-500 hidden md:table-cell whitespace-normal break-words">{item.source}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="p-3 text-right font-bold">Subtotal</td>
                <td className="p-3 text-right font-bold">{meal.totals.calories.toFixed(1)}</td>
                <td className="p-3 text-right font-bold">{meal.totals.protein.toFixed(1)}</td>
                <td className="p-3 hidden md:table-cell"></td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
        <tfoot className="font-bold text-slate-800">
           <tr className="border-t-2 border-slate-300">
            <td className="p-3">TOTAL GERAL</td>
            <td className="p-3 text-right">{totals.calories.toFixed(1)}</td>
            <td className="p-3 text-right">{totals.protein.toFixed(1)}</td>
            <td className="p-3 hidden md:table-cell"></td>
           </tr>
        </tfoot>
      </table>
    </div>
  </div>
);

interface ResultsDisplayProps {
  data: AnalysisResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data }) => {
  const { comparison, dietPlanDetails, consumedDetails } = data;

  const allMealNames = [...new Set([
    ...dietPlanDetails.map(m => m.name),
    ...consumedDetails.map(m => m.name)
  ])];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">Resumo Comparativo</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-slate-200 text-slate-500">
              <tr>
                <th className="p-3 font-semibold text-left">Refeição / Métrica</th>
                <th className="p-3 font-semibold text-center">Planejado (kcal / prot.)</th>
                <th className="p-3 font-semibold text-center">Consumido (kcal / prot.)</th>
              </tr>
            </thead>
            <tbody className="text-base">
              <tr className="font-bold bg-slate-50 text-slate-800">
                <td className="p-3 font-semibold text-left">Total Geral</td>
                <td className="p-3 font-mono font-semibold text-center">{comparison.dietPlan.calories.toFixed(1)} / {comparison.dietPlan.protein.toFixed(1)}g</td>
                <td className="p-3 font-mono font-semibold text-center">{comparison.consumed.calories.toFixed(1)} / {comparison.consumed.protein.toFixed(1)}g</td>
              </tr>
              {allMealNames.map((mealName, index) => {
                const plannedMeal = dietPlanDetails.find(m => m.name === mealName);
                const consumedMeal = consumedDetails.find(m => m.name === mealName);

                return (
                  <tr key={index} className="border-t border-slate-100">
                    <td className="p-3 font-medium text-slate-700 text-left">{mealName}</td>
                    <td className="p-3 font-mono text-center">
                      {plannedMeal ? `${plannedMeal.totals.calories.toFixed(1)} / ${plannedMeal.totals.protein.toFixed(1)}g` : '—'}
                    </td>
                    <td className="p-3 font-mono text-center">
                      {consumedMeal ? `${consumedMeal.totals.calories.toFixed(1)} / ${consumedMeal.totals.protein.toFixed(1)}g` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DataTable title="Detalhes da Dieta Planejada" meals={dietPlanDetails} totals={comparison.dietPlan} />
        <DataTable title="Detalhes do Consumo de Hoje" meals={consumedDetails} totals={comparison.consumed} />
      </div>
    </div>
  );
};

export default ResultsDisplay;