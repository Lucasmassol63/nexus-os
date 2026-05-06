import React, { useState, useEffect, useCallback } from 'react';
import { Athlete, FoodItem, MealLog, FoodCategory } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { getFoods, logMeal, deleteMealLog, getNutritionHistory } from '../../services/nutritionService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface NutritionViewProps {
  athlete: Athlete;
}

export const NutritionView: React.FC<NutritionViewProps> = ({ athlete }) => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [dailyLog, setDailyLog] = useState<{cals: number, pro: number, carbs: number, fat: number} | null>(null);
  
  const [mealType, setMealType] = useState<MealLog['type']>('Déjeuner');
  const [activeCategory, setActiveCategory] = useState<FoodCategory>('PROTEIN');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState(100); 
  const [currentMealItems, setCurrentMealItems] = useState<{ item: FoodItem; quantity: number }[]>([]);

  const loadMeals = useCallback(async () => {
    const history = await getNutritionHistory(athlete.id);
    setMeals(history);
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = history.filter(m => m.date === today);
    const totals = todaysMeals.reduce((acc, meal) => ({
      cals: acc.cals + meal.totalCalories,
      pro: acc.pro + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat
    }), { cals: 0, pro: 0, carbs: 0, fat: 0 });
    setDailyLog(totals);
  }, [athlete.id]);

  useEffect(() => {
    const init = async () => {
      const f = await getFoods();
      setFoods(f);
      await loadMeals();
    };
    init();
  }, [athlete.id]);

  const handleAddItemToMeal = () => {
    const food = foods.find(f => f.id === selectedFoodId);
    if (food) {
      setCurrentMealItems([...currentMealItems, { item: food, quantity }]);
      setSelectedFoodId('');
      setQuantity(100); 
    }
  };

  const handleRemoveItemFromMeal = (index: number) => {
    const newItems = [...currentMealItems];
    newItems.splice(index, 1);
    setCurrentMealItems(newItems);
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm("Supprimer ce repas de l'historique ?")) {
      await deleteMealLog(id);
      await loadMeals();
    }
  };

  const handleSaveMeal = async () => {
    if (currentMealItems.length === 0) return;
    const newMeal: MealLog = {
      id: Math.random().toString(),
      date: new Date().toISOString().split('T')[0],
      type: mealType,
      foods: currentMealItems,
      totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0
    };
    await logMeal(athlete.id, newMeal);
    setCurrentMealItems([]);
    setShowAddMeal(false);
    await loadMeals();
    alert(`Repas ajouté ! +150 XP`);
  };

  const getUnitLabel = (unit: string) => unit === 'piece' ? 'unité(s)' : unit;

  const chartData = dailyLog ? [
    { name: 'Protéines', value: dailyLog.pro * 4, color: '#EF4444' },
    { name: 'Glucides', value: dailyLog.carbs * 4, color: '#FFA14D' },
    { name: 'Lipides', value: dailyLog.fat * 9, color: '#3B82F6' }
  ] : [];

  const targetCalories = 3000;
  const filteredFoods = foods.filter(f => f.category === activeCategory);
  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals.filter(m => m.date === today);

  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-3xl text-white uppercase tracking-wider">Suivi Nutrition</h2>
          <p className="text-nexus-gray text-xs tracking-widest uppercase">Journalier & Macros</p>
        </div>
        <button 
          onClick={() => setShowHelpModal(true)}
          className="text-xs bg-white/10 hover:bg-white/20 text-nexus-gold font-bold uppercase px-3 py-2 rounded-lg border border-nexus-gold/30 transition-colors"
        >
          ? Aide Repas
        </button>
      </div>

      {/* Main Dashboard */}
      {dailyLog && (
        <GlassCard className="p-6 relative">
           <div className="flex justify-between items-start">
              <div className="relative w-32 h-32">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={chartData} innerRadius={35} outerRadius={50} dataKey="value">
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                       </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xs text-nexus-gray uppercase">Total</span>
                    <span className="font-display font-bold text-white text-lg">{dailyLog.cals}</span>
                 </div>
              </div>

              <div className="flex-1 pl-6 space-y-3">
                 <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                       <span>Protéines</span>
                       <span className="text-red-500 font-bold">{dailyLog.pro}g</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (dailyLog.pro / 200) * 100)}%` }}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                       <span>Glucides</span>
                       <span className="text-nexus-gold font-bold">{dailyLog.carbs}g</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-nexus-gold" style={{ width: `${Math.min(100, (dailyLog.carbs / 350) * 100)}%` }}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                       <span>Lipides</span>
                       <span className="text-blue-500 font-bold">{dailyLog.fat}g</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (dailyLog.fat / 90) * 100)}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <span className="text-[10px] text-nexus-gray uppercase tracking-widest">Objectif Calories: {targetCalories}</span>
              <div className="h-2 bg-black rounded-full mt-2 overflow-hidden border border-white/10">
                 <div className="h-full bg-white" style={{ width: `${Math.min(100, (dailyLog.cals / targetCalories) * 100)}%` }}></div>
              </div>
           </div>
        </GlassCard>
      )}

      {/* Add Meal Button */}
      <Button fullWidth onClick={() => setShowAddMeal(true)} className="py-4 text-lg">
        + AJOUTER UN REPAS
      </Button>

      {/* Today's Meals List */}
      <div className="space-y-3">
         <h3 className="font-display text-white uppercase text-lg">Journal du jour</h3>
         {todaysMeals.length === 0 ? (
            <p className="text-nexus-gray text-xs italic text-center py-4">Aucun repas enregistré aujourd'hui.</p>
         ) : (
            todaysMeals.map((meal) => (
              <div key={meal.id} className="bg-white/5 border border-white/5 p-4 rounded-xl relative group">
                 <button 
                   onClick={() => handleDeleteLog(meal.id)}
                   className="absolute top-2 right-2 p-2 text-nexus-gray hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   🗑
                 </button>
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-nexus-gold font-bold uppercase text-sm">{meal.type}</span>
                    <span className="text-white font-bold">{meal.totalCalories} kcal</span>
                 </div>
                 <div className="space-y-1">
                    {meal.foods.map((f: any, idx: number) => (
                       <div key={idx} className="flex justify-between text-xs text-gray-400">
                          <span>{f.food_name ?? f.item?.name}</span>
                          <span>{f.quantity} {f.unit ?? f.item?.unit}</span>
                       </div>
                    ))}
                 </div>
                 <div className="mt-2 pt-2 border-t border-white/5 flex gap-3 text-[10px] text-nexus-gray uppercase font-bold">
                    <span>P: {meal.totalProtein}g</span>
                    <span>G: {meal.totalCarbs}g</span>
                    <span>L: {meal.totalFat}g</span>
                 </div>
              </div>
            ))
         )}
      </div>

      {/* ADD MEAL MODAL */}
      {showAddMeal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/90">
              <h2 className="font-display text-2xl text-white uppercase">Ajout Repas</h2>
              <button onClick={() => setShowAddMeal(false)} className="text-nexus-red font-bold">Fermer</button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meal Type */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                 {['Petit Déjeuner', 'Déjeuner', 'Collation', 'Dîner'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setMealType(t as any)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-colors ${mealType === t ? 'bg-nexus-gold text-black border-nexus-gold' : 'border-white/20 text-gray-400'}`}
                    >
                       {t}
                    </button>
                 ))}
              </div>

              {/* Category Filter */}
              <div className="grid grid-cols-2 gap-2">
                 {[
                   { id: 'PROTEIN', label: 'Protéines' },
                   { id: 'STARCH', label: 'Féculents' },
                   { id: 'VEGETABLE', label: 'Légumes/Fruits' },
                   { id: 'OTHER', label: 'Autres' }
                 ].map(c => (
                   <button
                     key={c.id}
                     onClick={() => { setActiveCategory(c.id as any); setSelectedFoodId(''); }}
                     className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-colors ${activeCategory === c.id ? 'bg-white/10 border-white text-white' : 'border-white/5 text-nexus-gray hover:bg-white/5'}`}
                   >
                     {c.label}
                   </button>
                 ))}
              </div>

              {/* Food Selector */}
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-nexus-gray uppercase mb-2 block">Choisir un aliment</label>
                    <select 
                       className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white outline-none appearance-none"
                       value={selectedFoodId}
                       onChange={(e) => {
                          setSelectedFoodId(e.target.value);
                          const f = foods.find(food => food.id === e.target.value);
                          if(f) setQuantity(f.unit === 'piece' ? 1 : 100);
                       }}
                    >
                       <option value="">Sélectionner...</option>
                       {filteredFoods.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.calories}kcal/{f.unit === 'piece' ? 'unité' : '100'+f.unit})</option>
                       ))}
                    </select>
                 </div>

                 {selectedFoodId && (
                    <div className="animate-in fade-in">
                       <label className="text-xs font-bold text-nexus-gray uppercase mb-2 block">
                          Quantité ({getUnitLabel(foods.find(f => f.id === selectedFoodId)?.unit || '')})
                       </label>
                       <div className="flex gap-4 items-center">
                          <input 
                             type="number"
                             className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white outline-none text-center font-display text-xl"
                             value={quantity}
                             onChange={(e) => setQuantity(parseFloat(e.target.value))}
                          />
                          <Button onClick={handleAddItemToMeal}>Ajouter</Button>
                       </div>
                    </div>
                 )}
              </div>

              {/* Current Meal Preview */}
              {currentMealItems.length > 0 && (
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h4 className="text-white font-bold uppercase text-sm mb-3 border-b border-white/10 pb-2">Contenu du repas</h4>
                    <p className="text-[10px] text-nexus-gray mb-2 italic">Cliquez sur un élément pour le retirer</p>
                    <div className="space-y-2 mb-4">
                       {currentMealItems.map((item, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleRemoveItemFromMeal(idx)}
                            className="flex justify-between items-center text-sm text-gray-300 p-2 rounded hover:bg-red-500/20 cursor-pointer group transition-colors"
                          >
                             <span>{item.item.name}</span>
                             <div className="flex items-center gap-2">
                               <span className="font-bold">{item.quantity} {item.item.unit}</span>
                               <span className="text-red-500 opacity-0 group-hover:opacity-100">✕</span>
                             </div>
                          </div>
                       ))}
                    </div>
                    <Button fullWidth onClick={handleSaveMeal} className="bg-green-600 shadow-none hover:bg-green-500">
                       Valider le Repas (+150 XP)
                    </Button>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in zoom-in-95 p-6 overflow-y-auto">
           <div className="max-w-md mx-auto w-full">
             <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
               <h2 className="font-display text-2xl text-nexus-gold uppercase">Guide Nutrition</h2>
               <button onClick={() => setShowHelpModal(false)} className="text-white font-bold">✕</button>
             </div>
             <div className="space-y-8 pb-12">
               <section>
                 <h3 className="text-white font-bold uppercase mb-2 border-l-4 border-gray-500 pl-3">Journée OFF (Repos)</h3>
                 <p className="text-sm text-nexus-gray mb-3">Réduire les glucides, augmenter les légumes et les bonnes graisses. Focus récupération.</p>
                 <div className="bg-white/5 p-4 rounded-xl text-sm space-y-2">
                   <p><strong className="text-nexus-gold">Matin:</strong> Oeufs brouillés (3) + Avocat + Fruit</p>
                   <p><strong className="text-nexus-gold">Midi:</strong> Poulet + Beaucoup de légumes + Huile d'olive</p>
                   <p><strong className="text-nexus-gold">Soir:</strong> Poisson blanc + Légumes vapeurs + Yaourt Grec</p>
                 </div>
               </section>
               <section>
                 <h3 className="text-white font-bold uppercase mb-2 border-l-4 border-blue-500 pl-3">1 Entraînement / Jour</h3>
                 <p className="text-sm text-nexus-gray mb-3">Glucides concentrés autour de l'entraînement. Apport protéique constant.</p>
                 <div className="bg-white/5 p-4 rounded-xl text-sm space-y-2">
                   <p><strong className="text-nexus-gold">Matin:</strong> Avoine + Whey + Beurre de cacahuète</p>
                   <p><strong className="text-nexus-gold">Midi:</strong> Riz Basmati (150g) + Dinde + Légumes</p>
                   <p><strong className="text-nexus-gold">Post-Training:</strong> Banane + Shake</p>
                   <p><strong className="text-nexus-gold">Soir:</strong> Patate douce + Viande maigre + Salade</p>
                 </div>
               </section>
               <section>
                 <h3 className="text-white font-bold uppercase mb-2 border-l-4 border-cyan-500 pl-3">2 Entraînements (Eau)</h3>
                 <p className="text-sm text-nexus-gray mb-3">Haute dépense énergétique. Augmenter les portions de féculents à chaque repas.</p>
                 <div className="bg-white/5 p-4 rounded-xl text-sm space-y-2">
                   <p><strong className="text-nexus-gold">Matin:</strong> Omelette (3 oeufs) + Pain Complet + Fruit</p>
                   <p><strong className="text-nexus-gold">Collation:</strong> Amandes + Fruit</p>
                   <p><strong className="text-nexus-gold">Midi:</strong> Pâtes (200g) + Poulet + Légumes</p>
                   <p><strong className="text-nexus-gold">Soir:</strong> Riz + Saumon + Légumes + Huile d'olive</p>
                 </div>
               </section>
               <section>
                 <h3 className="text-white font-bold uppercase mb-2 border-l-4 border-nexus-red pl-3">Intensif (2 Eau + 1 Muscu)</h3>
                 <p className="text-sm text-nexus-gray mb-3">Volume critique. Ne jamais sauter de repas. Hydratation maximale.</p>
                 <div className="bg-white/5 p-4 rounded-xl text-sm space-y-2">
                   <p><strong className="text-nexus-gold">Matin:</strong> Gros bowl Avoine + Whey + Banane + Oeufs à côté</p>
                   <p><strong className="text-nexus-gold">Midi:</strong> Riz/Pâtes (250g) + Viande Rouge + Légumes</p>
                   <p><strong className="text-nexus-gold">Pre-Muscu:</strong> Fruit + BCAA</p>
                   <p><strong className="text-nexus-gold">Soir:</strong> Quinoa + Poisson Gras + Avocat + Légumes</p>
                 </div>
               </section>
               <section>
                 <h3 className="text-white font-bold uppercase mb-2 border-l-4 border-nexus-gold pl-3">Jour de Match</h3>
                 <p className="text-sm text-nexus-gray mb-3">Digestion facile. Éviter les graisses et fibres avant le match. Charge glucidique.</p>
                 <div className="bg-white/5 p-4 rounded-xl text-sm space-y-2">
                   <p><strong className="text-nexus-gold">H-4:</strong> Riz blanc + Poulet (pas de sauce, peu de légumes)</p>
                   <p><strong className="text-nexus-gold">H-2:</strong> Compote + Barre céréale</p>
                   <p><strong className="text-nexus-gold">Mi-Temps:</strong> Boisson isotonique + Gel</p>
                   <p><strong className="text-nexus-gold">Après-Match:</strong> REPAS PLAISIR (Pizza/Burger maison) pour refaire les stocks.</p>
                 </div>
               </section>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};