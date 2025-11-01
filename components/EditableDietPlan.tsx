import React, { useState } from 'react';
import DietPlanChecklist from './DietPlanChecklist';
import TextAreaInput from './TextAreaInput';
import PencilIcon from './icons/PencilIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface EditableDietPlanProps {
  dietPlan: string;
  onDietPlanChange: (value: string) => void;
  dailyIntake: string;
  onDailyIntakeChange: (value: string) => void;
  isReadOnly: boolean;
}

// Helper to escape strings for RegExp
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const EditableDietPlan: React.FC<EditableDietPlanProps> = ({ dietPlan, onDietPlanChange, dailyIntake, onDailyIntakeChange, isReadOnly }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleItem = (itemText: string, isChecked: boolean) => {
    const cleanedIntake = dailyIntake.split('\n').filter(line => line.trim() !== '').join('\n');
    
    if (isChecked) {
      // Add item if not already present
      if (!dailyIntake.includes(itemText)) {
        onDailyIntakeChange((cleanedIntake ? cleanedIntake + '\n' : '') + itemText);
      }
    } else {
      // Remove item
      const regex = new RegExp(`^${escapeRegExp(itemText)}$`, 'gm');
      const newIntake = dailyIntake.replace(regex, '').split('\n').filter(line => line.trim() !== '').join('\n');
      onDailyIntakeChange(newIntake);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-slate-700">Sua Dieta Planejada</h3>
        {!isReadOnly && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            {isEditing ? <CheckCircleIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
            {isEditing ? 'Salvar Plano' : 'Editar Plano'}
          </button>
        )}
      </div>
      {isEditing ? (
        <TextAreaInput
          id="diet-plan-edit"
          label=""
          value={dietPlan}
          onChange={(e) => onDietPlanChange(e.target.value)}
          placeholder="Cole sua dieta planejada aqui..."
          rows={12}
        />
      ) : (
        <div className="max-h-80 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
          <DietPlanChecklist
            planText={dietPlan}
            intakeText={dailyIntake}
            onToggleItem={handleToggleItem}
            isReadOnly={isReadOnly}
          />
        </div>
      )}
    </div>
  );
};

export default EditableDietPlan;
