import React, { useState, useEffect } from 'react';
import type { Billing } from '../types';
import DollarSignIcon from './icons/DollarSignIcon';

interface BillingSettingsProps {
  billing: Billing;
  onBillingChange: (billing: Billing) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const BillingSettings: React.FC<BillingSettingsProps> = ({ billing, onBillingChange }) => {
  const [personalFee, setPersonalFee] = useState(billing.personalFee.toString());
  const [coachingFee, setCoachingFee] = useState(billing.coachingFee.toString());

  useEffect(() => {
    setPersonalFee(billing.personalFee.toString());
    setCoachingFee(billing.coachingFee.toString());
  }, [billing]);

  const handleFeeChange = (
    feeType: 'personal' | 'coaching',
    value: string
  ) => {
    const numericValue = parseFloat(value) || 0;
    if (feeType === 'personal') {
      setPersonalFee(value);
    } else {
      setCoachingFee(value);
    }
    onBillingChange({
      ...billing,
      [feeType === 'personal' ? 'personalFee' : 'coachingFee']: numericValue,
    });
  };

  const personalRepasse = parseFloat(personalFee) * 0.9;
  const coachingRepasse = parseFloat(coachingFee) * 0.5;
  const totalRepasse = personalRepasse + coachingRepasse;

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-center gap-3 mb-6">
        <DollarSignIcon className="w-7 h-7 text-indigo-600" />
        <h2 className="text-2xl font-bold text-center text-indigo-600">Faturamento Mensal</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="personal-fee" className="block text-sm font-medium text-slate-600">
              Valor do Personal (Presencial)
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <input
                type="number"
                id="personal-fee"
                value={personalFee}
                onChange={(e) => handleFeeChange('personal', e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-md border-gray-300 pl-10 pr-2 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Taxa da plataforma: 10%</p>
          </div>
          <div>
            <label htmlFor="coaching-fee" className="block text-sm font-medium text-slate-600">
              Valor do Acompanhamento (App)
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <input
                type="number"
                id="coaching-fee"
                value={coachingFee}
                onChange={(e) => handleFeeChange('coaching', e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-md border-gray-300 pl-10 pr-2 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Repasse para o instrutor: 50% (após taxas do cartão)</p>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center text-center md:text-left">
            <h3 className="font-semibold text-slate-700">Seu Repasse Estimado</h3>
            <div className="space-y-2 mt-2">
                <div className="text-sm">
                    <span className="text-slate-600">Personal: </span>
                    <span className="font-semibold">{formatCurrency(personalRepasse)}</span>
                </div>
                <div className="text-sm">
                    <span className="text-slate-600">Acompanhamento: </span>
                    <span className="font-semibold">{formatCurrency(coachingRepasse)}</span>
                </div>
                <div className="text-lg font-bold border-t border-slate-300 pt-2 mt-2">
                    <span className="text-slate-800">Total: </span>
                    <span className="text-indigo-600">{formatCurrency(totalRepasse)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;
