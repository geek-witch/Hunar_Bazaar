import React, { useState } from 'react';
import { SubscriptionPlan } from '../types';
import { Check, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';

interface SubscriptionsPageProps {
  plans: SubscriptionPlan[];
  onUpdatePlans: (plans: SubscriptionPlan[]) => void;
}

export const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({ plans, onUpdatePlans }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit State
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editFeatures, setEditFeatures] = useState<string[]>([]);

  const startEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setEditPrice(plan.price);
    setEditFeatures([...plan.features]);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const updatedPlans = plans.map(p => p.id === id ? { ...p, price: editPrice, features: editFeatures } : p);
    onUpdatePlans(updatedPlans);
    setEditingId(null);
  };

  // Feature Management
  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...editFeatures];
    newFeatures[index] = value;
    setEditFeatures(newFeatures);
  };

  const addFeature = () => {
    setEditFeatures([...editFeatures, 'New Feature']);
  };

  const removeFeature = (index: number) => {
    const newFeatures = editFeatures.filter((_, i) => i !== index);
    setEditFeatures(newFeatures);
  };

  // Validation Check
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val >= 0) {
      setEditPrice(val);
    }
  };
  {/*Subscription cards*/ } 
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col ${
              plan.type === 'Premium' 
                ? 'bg-[#E6EEF9] text-[#0E4B5B] shadow-2xl shadow-blue-900/20 scale-100 lg:scale-105 border-2 border-[#0E4B5B] z-10' 
                : 'bg-[#E6EEF9] text-gray-800 shadow-sm border border-blue-100'
            }`}
          >
             {plan.type === 'Premium' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0E4B5B] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm border border-white">
                Most Popular
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#0E4B5B]">
                {plan.name}
              </h3>
              <p className="text-sm mt-1 text-gray-500">
                {plan.type === 'Free' ? 'For casual learners' : plan.type === 'Premium' ? 'For dedicated learners & teachers' : 'For power users & companies'}
              </p>
            </div>
             {/*[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none*/}
            <div className="mb-6 flex items-end gap-1 min-h-[4rem]">
              {editingId === plan.id ? (
                <div className="flex flex-col w-full gap-2">
                   <label className="text-xs font-semibold opacity-70 text-gray-500">Monthly Price (PKR)</label>
                   <input
                    type="number"
                    min="0"
                    value={editPrice}
                    onChange={handlePriceChange}
                    placeholder="Enter monthly price"
                    title="Monthly Price (PKR)"
                    aria-label="Monthly Price in PKR"
                    className="w-full px-3 py-2 rounded-lg text-gray-800 text-xl font-bold border-2 border-[#0E4B5B] focus:outline-none focus:ring-2 focus:ring-[#0E4B5B] focus:ring-offset-2 bg-white "
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <span className="text-4xl font-bold tracking-tight text-[#0E4B5B]">
                    {plan.price === 0 ? 'Free' : `${plan.price.toFixed(2)}`}
                  </span>
                  {plan.price > 0 && (
                     <span className="text-lg mb-1.5 text-gray-500">
                       {plan.currency}/month
                     </span>
                  )}
                    
                  <button 
                  /*Edit button*/
                    onClick={() => startEdit(plan)} 
                    className="ml-auto mb-2 p-2.5 rounded-lg transition-all duration-200 hover:scale-110 text-[#0E4B5B] bg-blue-100 border-2 border-[#0E4B5B] shadow-md hover:shadow-lg hover:bg-[#0E4B5B] hover:text-white"
                    title="Edit Plan"
                  >
                    <Edit2 size={18} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>
              {/*Features List*/ } 
            <div className="flex-1">
              <ul className="space-y-4 mb-8">
                {editingId === plan.id ? (
                  <>
                    {editFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                         <input 
                           type="text"
                           placeholder="Feature description"
                           title={`Feature ${idx + 1}`}
                           aria-label={`Feature ${idx + 1}`}
                           value={feature}
                           onChange={(e) => handleFeatureChange(idx, e.target.value)}
                           className="flex-1 px-3 py-2 text-sm rounded-lg border-2 border-[#0E4B5B] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0E4B5B] focus:ring-offset-1 shadow-sm bg-white"
                         />
                         <button 
                           onClick={() => removeFeature(idx)}
                           className="p-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-red-600"
                           title="Remove Feature"
                         >
                           <Trash2 size={16} strokeWidth={2.5} />
                         </button>
                      </li>
                    ))}
                    <button 
                      onClick={addFeature}
                      className="flex items-center justify-center gap-2 text-sm font-bold mt-3 px-3 py-2.5 rounded-lg border-2 border-[#0E4B5B] transition-all duration-200 w-full text-[#0E4B5B] bg-blue-50 hover:bg-[#0E4B5B] hover:text-white shadow-sm hover:shadow-md hover:scale-105"
                    >
                      <Plus size={18} strokeWidth={2.5} /> Add Feature
                    </button>
                  </>
                ) : (
                  plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full p-1 flex-shrink-0 bg-[#0E4B5B] text-white shadow-sm">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="text-sm text-gray-600">
                        {feature}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            {/*save and cancel*/ } 
            {editingId === plan.id ? (
               <div className="flex gap-3">
                  <button 
                    onClick={() => saveEdit(plan.id)} 
                    className="flex-1 bg-[#0E4B5B] hover:bg-emerald-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-emerald-600"
                  >
                    <Save size={20} strokeWidth={2.5}/> Save
                  </button>
                  <button 
                    onClick={cancelEdit} 
                    className="flex-1 bg-[#0E4B5B] hover:bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-red-600"
                  >
                    <X size={20} strokeWidth={2.5}/> Cancel
                  </button>
               </div>
            ) : (
              <button className="w-full py-3 rounded-lg font-bold transition-all duration-200 bg-[#0E4B5B] text-white hover:bg-[#093540] shadow-md hover:shadow-lg hover:scale-105 border-2 border-[#0E4B5B]">
                {plan.type === 'Free' ? 'Your Current Plan' : `Upgrade to ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};