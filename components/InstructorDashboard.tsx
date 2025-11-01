import React, { useState } from 'react';
import type { Instructor, Client, Routine } from '../types';
import UsersIcon from './icons/UsersIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import TextAreaInput from './TextAreaInput';
import WorkoutPlanner from './WorkoutPlanner';
import BillingSettings from './BillingSettings';

interface InstructorDashboardProps {
  instructorData: Instructor;
  onDataChange: (data: Instructor) => void;
  createNewRoutine: () => Routine;
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ instructorData, onDataChange, createNewRoutine }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  const selectedClient = instructorData.clients.find(c => c.id === selectedClientId) || null;

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) {
      alert("Nome e e-mail do aluno são obrigatórios.");
      return;
    }
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: newClientName.trim(),
      email: newClientEmail.trim(),
      dietPlan: 'Dieta ainda não definida pelo instrutor.',
      routine: createNewRoutine(),
      billing: { personalFee: 0, coachingFee: 0 },
    };
    const updatedData = { ...instructorData, clients: [...instructorData.clients, newClient] };
    onDataChange(updatedData);
    setNewClientName('');
    setNewClientEmail('');
    setSelectedClientId(newClient.id);
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("Tem certeza que deseja remover este aluno? Todos os seus dados serão perdidos.")) {
      const updatedClients = instructorData.clients.filter(c => c.id !== clientId);
      onDataChange({ ...instructorData, clients: updatedClients });
      if (selectedClientId === clientId) {
        setSelectedClientId(null);
      }
    }
  };

  const handleClientDataChange = (clientId: string, updates: Partial<Client>) => {
    const updatedClients = instructorData.clients.map(c =>
      c.id === clientId ? { ...c, ...updates } : c
    );
    onDataChange({ ...instructorData, clients: updatedClients });
  };
  
  const handleClientRoutineChange = (routine: Routine) => {
      if(!selectedClientId) return;
      handleClientDataChange(selectedClientId, { routine });
  }

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Client List and Management */}
      <aside className="lg:col-span-1 bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200 h-fit">
        <div className="flex items-center justify-center gap-3 mb-4">
          <UsersIcon className="w-7 h-7 text-indigo-600" />
          <h2 className="text-2xl font-bold text-center text-indigo-600">Meus Alunos</h2>
        </div>
        
        <form onSubmit={handleAddClient} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 mb-4">
            <h3 className="font-semibold text-slate-700">Cadastrar Novo Aluno</h3>
            <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nome do Aluno"
                className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="E-mail do Aluno"
                className="block w-full bg-white border border-slate-300 rounded-md shadow-sm p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                <PlusIcon /> Cadastrar
            </button>
        </form>

        <ul className="space-y-2">
            {instructorData.clients.length === 0 && <p className="text-center text-slate-500 p-4">Nenhum aluno cadastrado.</p>}
            {instructorData.clients.map(client => (
                <li key={client.id} className="relative group">
                    <button
                        onClick={() => setSelectedClientId(client.id)}
                        className={`w-full text-left p-3 rounded-md transition-colors text-sm ${selectedClientId === client.id ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                        <p className="font-medium">{client.name}</p>
                        <p className={`text-xs ${selectedClientId === client.id ? 'text-indigo-200' : 'text-slate-500'}`}>{client.email}</p>
                    </button>
                    <button onClick={() => handleDeleteClient(client.id)} className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-slate-400 hover:text-red-500 hover:bg-white/50">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </li>
            ))}
        </ul>
      </aside>

      {/* Client Workspace */}
      <main className="lg:col-span-2">
        {selectedClient ? (
          <div className="space-y-8">
             <section className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200 animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-indigo-600">Plano de Dieta para {selectedClient.name}</h2>
                <TextAreaInput 
                    id="client-diet-plan"
                    label="Dieta Planejada"
                    value={selectedClient.dietPlan}
                    onChange={(e) => handleClientDataChange(selectedClient.id, { dietPlan: e.target.value })}
                    placeholder="Descreva a dieta para este aluno..."
                />
             </section>
             <section className="animate-fade-in">
                <WorkoutPlanner 
                    routine={selectedClient.routine} 
                    onRoutineChange={handleClientRoutineChange}
                />
             </section>
             <section className="animate-fade-in">
                <BillingSettings 
                    billing={selectedClient.billing}
                    onBillingChange={(billing) => handleClientDataChange(selectedClient.id, { billing })}
                />
             </section>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-white rounded-lg p-8 shadow-sm border border-slate-200 text-center">
            <p className="text-slate-500">Selecione um aluno da lista para ver ou editar seus planos.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default InstructorDashboard;
