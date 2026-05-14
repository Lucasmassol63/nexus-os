import React, { useState } from 'react';
import { Athlete, MealLog } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { db } from '../../services/mockDb';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface NutritionViewProps { athlete: Athlete; }

// ── LOCAL FOOD DB (120+ aliments) ─────────────────────────────────────────────
type FoodCat = 'PROTEIN' | 'STARCH' | 'VEGETABLE' | 'OTHER';

interface LocalFood {
  id: string; name: string; category: FoodCat;
  unit: 'g' | 'piece' | 'ml';
  calories: number; protein: number; carbs: number; fat: number;
  isCustom?: boolean;
}

const FOOD_DB: LocalFood[] = [
  // ─── PROTÉINES ──────────────────────────────────────────────────────────────
  { id:'p01', name:'Poulet (blanc)', category:'PROTEIN', unit:'g', calories:165, protein:31, carbs:0, fat:3.6 },
  { id:'p02', name:'Dinde (blanc)', category:'PROTEIN', unit:'g', calories:135, protein:29, carbs:0, fat:1.5 },
  { id:'p03', name:'Saumon', category:'PROTEIN', unit:'g', calories:208, protein:20, carbs:0, fat:13 },
  { id:'p04', name:'Thon (boîte, eau)', category:'PROTEIN', unit:'g', calories:116, protein:26, carbs:0, fat:1 },
  { id:'p05', name:'Cabillaud', category:'PROTEIN', unit:'g', calories:82, protein:18, carbs:0, fat:0.7 },
  { id:'p06', name:'Crevettes', category:'PROTEIN', unit:'g', calories:99, protein:21, carbs:0.9, fat:1.1 },
  { id:'p07', name:'Steak haché 5%', category:'PROTEIN', unit:'g', calories:125, protein:21, carbs:0, fat:5 },
  { id:'p08', name:'Bœuf (rumsteck)', category:'PROTEIN', unit:'g', calories:187, protein:27, carbs:0, fat:8 },
  { id:'p09', name:'Porc (filet)', category:'PROTEIN', unit:'g', calories:143, protein:22, carbs:0, fat:5.5 },
  { id:'p10', name:'Jambon blanc (fin)', category:'PROTEIN', unit:'g', calories:95, protein:17, carbs:1, fat:2.5 },
  { id:'p11', name:'Whey Protein', category:'PROTEIN', unit:'g', calories:370, protein:78, carbs:6, fat:4 },
  { id:'p12', name:'Caséine', category:'PROTEIN', unit:'g', calories:360, protein:80, carbs:4, fat:2 },
  { id:'p13', name:'Oeuf entier', category:'PROTEIN', unit:'piece', calories:70, protein:6, carbs:0.6, fat:5 },
  { id:'p14', name:'Blanc d\'oeuf', category:'PROTEIN', unit:'piece', calories:17, protein:3.6, carbs:0.2, fat:0.1 },
  { id:'p15', name:'Fromage blanc 0%', category:'PROTEIN', unit:'g', calories:44, protein:8, carbs:4, fat:0.2 },
  { id:'p16', name:'Skyr nature', category:'PROTEIN', unit:'g', calories:65, protein:11, carbs:4, fat:0.2 },
  { id:'p17', name:'Yaourt grec 0%', category:'PROTEIN', unit:'g', calories:59, protein:10, carbs:4, fat:0.4 },
  { id:'p18', name:'Tofu ferme', category:'PROTEIN', unit:'g', calories:76, protein:8, carbs:1.9, fat:4.8 },
  { id:'p19', name:'Edamame', category:'PROTEIN', unit:'g', calories:121, protein:11, carbs:9, fat:5 },
  { id:'p20', name:'Cottage Cheese', category:'PROTEIN', unit:'g', calories:98, protein:11, carbs:3.4, fat:4.5 },
  { id:'p21', name:'Maquereau', category:'PROTEIN', unit:'g', calories:205, protein:19, carbs:0, fat:14 },
  { id:'p22', name:'Sardines (boîte)', category:'PROTEIN', unit:'g', calories:208, protein:25, carbs:0, fat:12 },
  { id:'p23', name:'Daurade', category:'PROTEIN', unit:'g', calories:100, protein:19, carbs:0, fat:2.5 },
  { id:'p24', name:'Poulet (cuisse)', category:'PROTEIN', unit:'g', calories:209, protein:26, carbs:0, fat:11 },
  { id:'p25', name:'Escalope de veau', category:'PROTEIN', unit:'g', calories:120, protein:22, carbs:0, fat:3 },
  { id:'p26', name:'Merlan', category:'PROTEIN', unit:'g', calories:77, protein:17, carbs:0, fat:0.8 },
  { id:'p27', name:'Tilapia', category:'PROTEIN', unit:'g', calories:96, protein:20, carbs:0, fat:1.7 },

  // ─── FÉCULENTS ──────────────────────────────────────────────────────────────
  { id:'s01', name:'Riz basmati (cuit)', category:'STARCH', unit:'g', calories:130, protein:2.7, carbs:28, fat:0.3 },
  { id:'s02', name:'Riz blanc (cuit)', category:'STARCH', unit:'g', calories:130, protein:2.7, carbs:28, fat:0.3 },
  { id:'s03', name:'Riz complet (cuit)', category:'STARCH', unit:'g', calories:122, protein:2.5, carbs:26, fat:0.9 },
  { id:'s04', name:'Pâtes (cuites)', category:'STARCH', unit:'g', calories:158, protein:6, carbs:31, fat:1 },
  { id:'s05', name:'Pâtes complètes (cuites)', category:'STARCH', unit:'g', calories:149, protein:6.5, carbs:29, fat:1.1 },
  { id:'s06', name:'Flocons d\'avoine', category:'STARCH', unit:'g', calories:389, protein:16.9, carbs:66, fat:6.9 },
  { id:'s07', name:'Avoine (cuite, gruau)', category:'STARCH', unit:'g', calories:71, protein:2.5, carbs:12, fat:1.4 },
  { id:'s08', name:'Pomme de terre (cuite vapeur)', category:'STARCH', unit:'g', calories:77, protein:2, carbs:17, fat:0.1 },
  { id:'s09', name:'Patate douce (cuite)', category:'STARCH', unit:'g', calories:86, protein:1.6, carbs:20, fat:0.1 },
  { id:'s10', name:'Quinoa (cuit)', category:'STARCH', unit:'g', calories:120, protein:4.4, carbs:21, fat:1.9 },
  { id:'s11', name:'Pain complet', category:'STARCH', unit:'g', calories:247, protein:13, carbs:41, fat:3.4 },
  { id:'s12', name:'Pain de seigle', category:'STARCH', unit:'g', calories:259, protein:9, carbs:48, fat:3 },
  { id:'s13', name:'Baguette tradition', category:'STARCH', unit:'g', calories:270, protein:9, carbs:55, fat:1 },
  { id:'s14', name:'Tortilla de blé (25cm)', category:'STARCH', unit:'piece', calories:218, protein:5.5, carbs:38, fat:5.5 },
  { id:'s15', name:'Lentilles corail (cuites)', category:'STARCH', unit:'g', calories:116, protein:9, carbs:20, fat:0.4 },
  { id:'s16', name:'Lentilles vertes (cuites)', category:'STARCH', unit:'g', calories:116, protein:9, carbs:20, fat:0.4 },
  { id:'s17', name:'Pois chiches (cuits)', category:'STARCH', unit:'g', calories:164, protein:9, carbs:27, fat:2.6 },
  { id:'s18', name:'Haricots rouges (cuits)', category:'STARCH', unit:'g', calories:127, protein:8.7, carbs:23, fat:0.5 },
  { id:'s19', name:'Maïs (boîte)', category:'STARCH', unit:'g', calories:86, protein:3.2, carbs:18, fat:1.2 },
  { id:'s20', name:'Millet (cuit)', category:'STARCH', unit:'g', calories:119, protein:3.5, carbs:24, fat:1 },
  { id:'s21', name:'Boulgour (cuit)', category:'STARCH', unit:'g', calories:83, protein:3, carbs:18, fat:0.2 },
  { id:'s22', name:'Semoule (cuite)', category:'STARCH', unit:'g', calories:112, protein:4, carbs:23, fat:0.2 },
  { id:'s23', name:'Galette de riz', category:'STARCH', unit:'piece', calories:35, protein:0.7, carbs:7.5, fat:0.3 },
  { id:'s24', name:'Crêpe nature', category:'STARCH', unit:'piece', calories:90, protein:3, carbs:13, fat:3 },
  { id:'s25', name:'Farine de sarrasin', category:'STARCH', unit:'g', calories:340, protein:13, carbs:68, fat:3.5 },

  // ─── LÉGUMES / FRUITS ───────────────────────────────────────────────────────
  { id:'v01', name:'Brocolis', category:'VEGETABLE', unit:'g', calories:34, protein:2.8, carbs:7, fat:0.4 },
  { id:'v02', name:'Épinards', category:'VEGETABLE', unit:'g', calories:23, protein:2.9, carbs:3.6, fat:0.4 },
  { id:'v03', name:'Courgette', category:'VEGETABLE', unit:'g', calories:17, protein:1.2, carbs:3.1, fat:0.3 },
  { id:'v04', name:'Poivron rouge', category:'VEGETABLE', unit:'g', calories:31, protein:1, carbs:6, fat:0.3 },
  { id:'v05', name:'Tomate', category:'VEGETABLE', unit:'piece', calories:22, protein:1, carbs:4.8, fat:0.2 },
  { id:'v06', name:'Concombre', category:'VEGETABLE', unit:'g', calories:16, protein:0.7, carbs:3.6, fat:0.1 },
  { id:'v07', name:'Carotte', category:'VEGETABLE', unit:'g', calories:41, protein:0.9, carbs:10, fat:0.2 },
  { id:'v08', name:'Chou-fleur', category:'VEGETABLE', unit:'g', calories:25, protein:2, carbs:5, fat:0.3 },
  { id:'v09', name:'Haricots verts', category:'VEGETABLE', unit:'g', calories:31, protein:1.8, carbs:7, fat:0.2 },
  { id:'v10', name:'Champignons', category:'VEGETABLE', unit:'g', calories:22, protein:3.1, carbs:3.3, fat:0.3 },
  { id:'v11', name:'Avocat', category:'VEGETABLE', unit:'piece', calories:250, protein:3, carbs:12, fat:23 },
  { id:'v12', name:'Banane', category:'VEGETABLE', unit:'piece', calories:105, protein:1.3, carbs:27, fat:0.4 },
  { id:'v13', name:'Pomme', category:'VEGETABLE', unit:'piece', calories:52, protein:0.3, carbs:14, fat:0.2 },
  { id:'v14', name:'Orange', category:'VEGETABLE', unit:'piece', calories:62, protein:1.2, carbs:15, fat:0.2 },
  { id:'v15', name:'Kiwi', category:'VEGETABLE', unit:'piece', calories:42, protein:0.8, carbs:10, fat:0.4 },
  { id:'v16', name:'Myrtilles', category:'VEGETABLE', unit:'g', calories:57, protein:0.7, carbs:14, fat:0.3 },
  { id:'v17', name:'Fraises', category:'VEGETABLE', unit:'g', calories:32, protein:0.7, carbs:7.7, fat:0.3 },
  { id:'v18', name:'Pastèque', category:'VEGETABLE', unit:'g', calories:30, protein:0.6, carbs:7.6, fat:0.2 },
  { id:'v19', name:'Mangue', category:'VEGETABLE', unit:'g', calories:60, protein:0.8, carbs:15, fat:0.4 },
  { id:'v20', name:'Ananas', category:'VEGETABLE', unit:'g', calories:50, protein:0.5, carbs:13, fat:0.1 },
  { id:'v21', name:'Raisin', category:'VEGETABLE', unit:'g', calories:69, protein:0.7, carbs:18, fat:0.2 },
  { id:'v22', name:'Betterave', category:'VEGETABLE', unit:'g', calories:43, protein:1.6, carbs:10, fat:0.2 },
  { id:'v23', name:'Céleri', category:'VEGETABLE', unit:'g', calories:16, protein:0.7, carbs:3, fat:0.2 },
  { id:'v24', name:'Asperges', category:'VEGETABLE', unit:'g', calories:20, protein:2.2, carbs:3.9, fat:0.1 },
  { id:'v25', name:'Salade verte (mélange)', category:'VEGETABLE', unit:'g', calories:15, protein:1.4, carbs:2.9, fat:0.2 },

  // ─── AUTRES (graisses saines, sauces, divers) ────────────────────────────────
  { id:'o01', name:'Huile d\'olive', category:'OTHER', unit:'g', calories:900, protein:0, carbs:0, fat:100 },
  { id:'o02', name:'Huile de coco', category:'OTHER', unit:'g', calories:900, protein:0, carbs:0, fat:100 },
  { id:'o03', name:'Beurre', category:'OTHER', unit:'g', calories:717, protein:0.9, carbs:0.1, fat:81 },
  { id:'o04', name:'Amandes', category:'OTHER', unit:'g', calories:579, protein:21, carbs:22, fat:50 },
  { id:'o05', name:'Noix', category:'OTHER', unit:'g', calories:654, protein:15, carbs:14, fat:65 },
  { id:'o06', name:'Noix de cajou', category:'OTHER', unit:'g', calories:553, protein:18, carbs:30, fat:44 },
  { id:'o07', name:'Beurre de cacahuète', category:'OTHER', unit:'g', calories:589, protein:25, carbs:20, fat:50 },
  { id:'o08', name:'Beurre d\'amande', category:'OTHER', unit:'g', calories:614, protein:21, carbs:19, fat:56 },
  { id:'o09', name:'Graines de chia', category:'OTHER', unit:'g', calories:486, protein:17, carbs:42, fat:31 },
  { id:'o10', name:'Graines de lin', category:'OTHER', unit:'g', calories:534, protein:18, carbs:29, fat:42 },
  { id:'o11', name:'Fromage (emmental)', category:'OTHER', unit:'g', calories:382, protein:28, carbs:0, fat:30 },
  { id:'o12', name:'Parmesan', category:'OTHER', unit:'g', calories:431, protein:38, carbs:4, fat:29 },
  { id:'o13', name:'Mozzarella', category:'OTHER', unit:'g', calories:280, protein:18, carbs:2.2, fat:22 },
  { id:'o14', name:'Lait demi-écrémé', category:'OTHER', unit:'ml', calories:46, protein:3.2, carbs:4.7, fat:1.5 },
  { id:'o15', name:'Lait d\'amande', category:'OTHER', unit:'ml', calories:13, protein:0.5, carbs:0.4, fat:1.1 },
  { id:'o16', name:'Crème fraîche 15%', category:'OTHER', unit:'g', calories:161, protein:2.8, carbs:3.3, fat:15 },
  { id:'o17', name:'Chocolat noir 70%', category:'OTHER', unit:'g', calories:598, protein:8, carbs:43, fat:43 },
  { id:'o18', name:'Miel', category:'OTHER', unit:'g', calories:304, protein:0.3, carbs:82, fat:0 },
  { id:'o19', name:'Confiture', category:'OTHER', unit:'g', calories:250, protein:0.5, carbs:65, fat:0.1 },
  { id:'o20', name:'Sauce soja', category:'OTHER', unit:'ml', calories:53, protein:8, carbs:5, fat:0 },
  { id:'o21', name:'Ketchup', category:'OTHER', unit:'g', calories:100, protein:1.6, carbs:24, fat:0.1 },
  { id:'o22', name:'Mayonnaise', category:'OTHER', unit:'g', calories:680, protein:1.2, carbs:2, fat:75 },
  { id:'o23', name:'Tahini', category:'OTHER', unit:'g', calories:595, protein:17, carbs:21, fat:54 },
  { id:'o24', name:'Gel énergétique', category:'OTHER', unit:'piece', calories:100, protein:0, carbs:25, fat:0 },
  { id:'o25', name:'Barre protéinée', category:'OTHER', unit:'piece', calories:200, protein:20, carbs:20, fat:7 },
  { id:'o26', name:'Boisson isotonique (500ml)', category:'OTHER', unit:'piece', calories:140, protein:0, carbs:35, fat:0 },
  { id:'o27', name:'Pizza (1 part)', category:'OTHER', unit:'piece', calories:285, protein:12, carbs:36, fat:10 },
  { id:'o28', name:'Burger (maison)', category:'OTHER', unit:'piece', calories:490, protein:28, carbs:40, fat:22 },
];

export const NutritionView: React.FC<NutritionViewProps> = ({ athlete }) => {
  const [customFoods, setCustomFoods] = useState<LocalFood[]>([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false);
  const [dailyLog, setDailyLog] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = athlete.nutritionHistory.filter(m => m.date === today);
    return todaysMeals.reduce((acc, meal) => ({
      cals: acc.cals + meal.totalCalories,
      pro: acc.pro + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat
    }), { cals: 0, pro: 0, carbs: 0, fat: 0 });
  });

  // Add Meal state
  const [mealType, setMealType] = useState<MealLog['type']>('Déjeuner');
  const [activeCategory, setActiveCategory] = useState<FoodCat>('PROTEIN');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [currentMealItems, setCurrentMealItems] = useState<{ item: LocalFood; quantity: number }[]>([]);
  const [searchFood, setSearchFood] = useState('');

  // Custom food form state
  const [cfName, setCfName] = useState('');
  const [cfCat, setCfCat] = useState<FoodCat>('PROTEIN');
  const [cfUnit, setCfUnit] = useState<'g'|'piece'|'ml'>('g');
  const [cfCals, setCfCals] = useState('');
  const [cfPro, setCfPro] = useState('');
  const [cfCarbs, setCfCarbs] = useState('');
  const [cfFat, setCfFat] = useState('');

  const allFoods = [...FOOD_DB, ...customFoods];
  const filteredFoods = allFoods.filter(f =>
    f.category === activeCategory &&
    (!searchFood || f.name.toLowerCase().includes(searchFood.toLowerCase()))
  );

  const getUnitLabel = (unit: string) => unit === 'piece' ? 'unité(s)' : unit === 'ml' ? 'ml' : 'g';

  const handleAddItemToMeal = () => {
    const food = allFoods.find(f => f.id === selectedFoodId);
    if (food) {
      setCurrentMealItems(prev => [...prev, { item: food, quantity }]);
      setSelectedFoodId('');
      setQuantity(100);
    }
  };

  const calcMealTotals = (items: { item: LocalFood; quantity: number }[]) => {
    return items.reduce((acc, { item, quantity: q }) => {
      const mult = item.unit === 'piece' ? q : q / 100;
      return {
        cals: acc.cals + item.calories * mult,
        pro: acc.pro + item.protein * mult,
        carbs: acc.carbs + item.carbs * mult,
        fat: acc.fat + item.fat * mult,
      };
    }, { cals: 0, pro: 0, carbs: 0, fat: 0 });
  };

  const handleSaveMeal = async () => {
    if (currentMealItems.length === 0) return;
    const totals = calcMealTotals(currentMealItems);
    const newMeal: MealLog = {
      id: Math.random().toString(),
      date: new Date().toISOString().split('T')[0],
      type: mealType,
      foods: currentMealItems.map(({ item, quantity: q }) => ({ item: item as any, quantity: q })),
      totalCalories: Math.round(totals.cals),
      totalProtein: Math.round(totals.pro),
      totalCarbs: Math.round(totals.carbs),
      totalFat: Math.round(totals.fat),
    };
    await db.logMeal(athlete.id, newMeal);
    setDailyLog(prev => ({
      cals: prev.cals + newMeal.totalCalories,
      pro: prev.pro + newMeal.totalProtein,
      carbs: prev.carbs + newMeal.totalCarbs,
      fat: prev.fat + newMeal.totalFat,
    }));
    setCurrentMealItems([]);
    setShowAddMeal(false);
  };

  const addCustomFood = () => {
    if (!cfName || !cfCals) return;
    const newFood: LocalFood = {
      id: `custom_${Date.now()}`,
      name: cfName, category: cfCat, unit: cfUnit,
      calories: parseFloat(cfCals) || 0,
      protein: parseFloat(cfPro) || 0,
      carbs: parseFloat(cfCarbs) || 0,
      fat: parseFloat(cfFat) || 0,
      isCustom: true,
    };
    setCustomFoods(prev => [...prev, newFood]);
    setCfName(''); setCfCat('PROTEIN'); setCfUnit('g'); setCfCals(''); setCfPro(''); setCfCarbs(''); setCfFat('');
    setShowCustomFoodForm(false);
    setActiveCategory(cfCat);
  };

  const targetCalories = 3000;
  const chartData = [
    { name: 'Protéines', value: dailyLog.pro * 4, color: '#EF4444' },
    { name: 'Glucides', value: dailyLog.carbs * 4, color: '#E8B800' },
    { name: 'Lipides', value: dailyLog.fat * 9, color: '#3B82F6' },
  ];

  const todaysMeals = athlete.nutritionHistory.filter(m => m.date === new Date().toISOString().split('T')[0]);

  const CAT_LABELS: Record<FoodCat, string> = { PROTEIN: 'Protéines', STARCH: 'Féculents', VEGETABLE: 'Légumes & Fruits', OTHER: 'Autres' };

  return (
    <div className="px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-3xl text-white uppercase tracking-wider">Suivi Nutrition</h2>
          <p className="text-nexus-gray text-xs tracking-widest uppercase">Journalier & Macros</p>
        </div>
        <button onClick={() => setShowHelpModal(true)}
          className="text-xs bg-white/10 hover:bg-white/20 text-nexus-gold font-bold uppercase px-3 py-2 rounded-lg border border-nexus-gold/30 transition-colors">
          ? Aide Repas
        </button>
      </div>

      {/* Dashboard macros */}
      <GlassCard className="p-6 relative">
        <div className="flex justify-between items-start">
          <div className="relative w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={35} outerRadius={50} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xs text-nexus-gray uppercase">Total</span>
              <span className="font-display font-bold text-white text-lg">{dailyLog.cals}</span>
            </div>
          </div>
          <div className="flex-1 pl-6 space-y-3">
            {[
              { label:'Protéines', val:dailyLog.pro, target:200, color:'#EF4444' },
              { label:'Glucides', val:dailyLog.carbs, target:350, color:'#E8B800' },
              { label:'Lipides', val:dailyLog.fat, target:90, color:'#3B82F6' },
            ].map(({ label, val, target, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>{label}</span><span className="font-bold" style={{ color }}>{Math.round(val)}g</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width:`${Math.min(100,(val/target)*100)}%`, backgroundColor:color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <span className="text-[10px] text-nexus-gray uppercase tracking-widest">Objectif : {targetCalories} kcal</span>
          <div className="h-2 bg-black rounded-full mt-2 overflow-hidden border border-white/10">
            <div className="h-full bg-nexus-gold rounded-full transition-all duration-700" style={{ width:`${Math.min(100,(dailyLog.cals/targetCalories)*100)}%` }} />
          </div>
        </div>
      </GlassCard>

      <Button fullWidth onClick={() => setShowAddMeal(true)} className="py-4 text-lg">+ AJOUTER UN REPAS</Button>

      {/* Journal du jour */}
      <div className="space-y-3">
        <h3 className="font-display text-white uppercase text-lg">Journal du jour</h3>
        {todaysMeals.length === 0 ? (
          <p className="text-nexus-gray text-xs italic text-center py-4">Aucun repas enregistré aujourd'hui.</p>
        ) : (
          todaysMeals.map((meal) => (
            <div key={meal.id} className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="text-nexus-gold font-bold uppercase text-sm">{meal.type}</span>
                <span className="text-white font-bold">{meal.totalCalories} kcal</span>
              </div>
              <div className="space-y-1">
                {meal.foods.map((f, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-400">
                    <span>{f.item.name}</span><span>{f.quantity} {f.item.unit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 flex gap-3 text-[10px] text-nexus-gray uppercase font-bold">
                <span className="text-red-400">P: {meal.totalProtein}g</span>
                <span className="text-nexus-gold">G: {meal.totalCarbs}g</span>
                <span className="text-blue-400">L: {meal.totalFat}g</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── MODAL AJOUT REPAS ────────────────────────────────────────────────── */}
      {showAddMeal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0f172a]">
            <h2 className="font-display text-xl text-white uppercase">Ajout Repas</h2>
            <button onClick={() => setShowAddMeal(false)} className="text-nexus-red font-bold">✕ Fermer</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Meal type */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['Petit Déjeuner','Déjeuner','Collation','Dîner'] as const).map(t => (
                <button key={t} onClick={() => setMealType(t as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap border transition-colors ${mealType===t?'bg-nexus-gold text-black border-nexus-gold':'border-white/20 text-gray-400'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Category tabs */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CAT_LABELS) as [FoodCat, string][]).map(([id, label]) => (
                <button key={id} onClick={() => { setActiveCategory(id); setSelectedFoodId(''); setSearchFood(''); }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase border transition-colors ${activeCategory===id?'bg-white/10 border-white text-white':'border-white/5 text-nexus-gray hover:bg-white/5'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <input placeholder="Chercher un aliment..." value={searchFood} onChange={e => setSearchFood(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-nexus-gold text-sm" />

            {/* Food selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-nexus-gray uppercase">Choisir un aliment ({filteredFoods.length})</label>
                <button onClick={() => setShowCustomFoodForm(true)}
                  className="text-[10px] text-nexus-gold hover:text-white border border-nexus-gold/30 rounded-lg px-2 py-1 transition-colors">
                  + Aliment perso
                </button>
              </div>
              <select className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white outline-none appearance-none text-sm"
                value={selectedFoodId} onChange={e => { setSelectedFoodId(e.target.value); const f=allFoods.find(x=>x.id===e.target.value); if(f) setQuantity(f.unit==='piece'?1:100); }}>
                <option value="">Sélectionner un aliment...</option>
                {filteredFoods.map(f => (
                  <option key={f.id} value={f.id}>{f.isCustom?'⭐ ':''}{f.name} · {f.calories} kcal/{f.unit==='piece'?'unité':f.unit==='ml'?'100ml':'100g'}</option>
                ))}
              </select>
            </div>

            {selectedFoodId && (() => {
              const food = allFoods.find(f => f.id === selectedFoodId)!;
              const mult = food.unit === 'piece' ? quantity : quantity / 100;
              return (
                <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10 animate-in fade-in">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[{l:'Kcal',v:Math.round(food.calories*mult),c:'text-white'},{l:'P',v:Math.round(food.protein*mult),c:'text-red-400'},{l:'G',v:Math.round(food.carbs*mult),c:'text-nexus-gold'},{l:'L',v:Math.round(food.fat*mult),c:'text-blue-400'}].map(({l,v,c}) => (
                      <div key={l} className="bg-black/30 rounded-lg py-2"><div className="text-[9px] text-nexus-gray uppercase mb-0.5">{l}</div><div className={`font-display font-bold ${c}`}>{v}g</div></div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-nexus-gray uppercase mb-2 block">Quantité ({getUnitLabel(food.unit)})</label>
                    <div className="flex gap-3 items-center">
                      <input type="number" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value)||0)}
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-white outline-none text-center font-display text-xl" />
                      <button onClick={handleAddItemToMeal}
                        className="bg-nexus-gold text-black font-bold px-4 py-3 rounded-xl uppercase text-sm hover:bg-white transition-colors">
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Current meal items */}
            {currentMealItems.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-white font-bold uppercase text-sm mb-3 border-b border-white/10 pb-2">Contenu du repas</h4>
                <div className="space-y-2 mb-4">
                  {currentMealItems.map((item, idx) => {
                    const mult = item.item.unit === 'piece' ? item.quantity : item.quantity / 100;
                    return (
                      <div key={idx} onClick={() => setCurrentMealItems(prev => prev.filter((_,i)=>i!==idx))}
                        className="flex justify-between items-center text-sm text-gray-300 p-2 rounded hover:bg-red-500/20 cursor-pointer group">
                        <span>{item.item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-nexus-gray">{Math.round(item.item.calories*mult)} kcal</span>
                          <span className="font-bold">{item.quantity}{item.item.unit}</span>
                          <span className="text-red-500 opacity-0 group-hover:opacity-100">✕</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const t = calcMealTotals(currentMealItems);
                  return (
                    <div className="flex gap-3 text-xs font-bold mb-3 py-2 border-t border-white/10">
                      <span className="text-white">{Math.round(t.cals)} kcal</span>
                      <span className="text-red-400">P:{Math.round(t.pro)}g</span>
                      <span className="text-nexus-gold">G:{Math.round(t.carbs)}g</span>
                      <span className="text-blue-400">L:{Math.round(t.fat)}g</span>
                    </div>
                  );
                })()}
                <button onClick={handleSaveMeal}
                  className="w-full bg-nexus-gold text-black font-bold py-3 rounded-xl uppercase text-sm hover:bg-white transition-colors">
                  ✓ Valider le Repas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL ALIMENT PERSONNALISÉ ──────────────────────────────────────── */}
      {showCustomFoodForm && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-end sm:items-center justify-center p-6" onClick={() => setShowCustomFoodForm(false)}>
          <div className="bg-[#1a2235] rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <div><h3 className="font-display text-white uppercase text-lg">Aliment perso</h3><p className="text-[9px] text-nexus-gray">Renseigne les macros pour 100g / unité</p></div>
              <button onClick={() => setShowCustomFoodForm(false)} className="text-nexus-gray hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Nom de l'aliment</label>
                <input placeholder="ex: Mon smoothie protéiné..." autoFocus value={cfName} onChange={e => setCfName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white placeholder-white/25 outline-none focus:border-nexus-gold text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Catégorie</label>
                  <select value={cfCat} onChange={e => setCfCat(e.target.value as FoodCat)} className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none text-sm">
                    {(Object.entries(CAT_LABELS) as [FoodCat,string][]).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">Unité</label>
                  <select value={cfUnit} onChange={e => setCfUnit(e.target.value as any)} className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none text-sm">
                    <option value="g">grammes (g)</option><option value="ml">millilitres (ml)</option><option value="piece">pièce</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{label:'Calories (kcal)', val:cfCals, set:setCfCals},{label:'Protéines (g)', val:cfPro, set:setCfPro},{label:'Glucides (g)', val:cfCarbs, set:setCfCarbs},{label:'Lipides (g)', val:cfFat, set:setCfFat}].map(({label,val,set}) => (
                  <div key={label}>
                    <label className="text-[9px] text-nexus-gray uppercase font-bold mb-1 block">{label}</label>
                    <input type="number" min="0" placeholder="0" value={val} onChange={e => set(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-nexus-gold text-sm" />
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-nexus-gray/60 italic text-center">Valeurs pour {cfUnit==='piece'?'1 unité':`100${cfUnit}`}</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCustomFoodForm(false)} className="flex-1 bg-white/5 text-nexus-gray py-3 rounded-xl text-sm">Annuler</button>
              <button onClick={addCustomFood} disabled={!cfName||!cfCals}
                className="flex-1 bg-nexus-gold text-black py-3 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-white transition-colors">
                ⭐ Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL AIDE ───────────────────────────────────────────────────────── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in zoom-in-95 p-6 overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="font-display text-2xl text-nexus-gold uppercase">Guide Nutrition</h2>
              <button onClick={() => setShowHelpModal(false)} className="text-white font-bold">✕</button>
            </div>
            <div className="space-y-8 pb-12">
              {[
                { title:'Journée OFF (Repos)', border:'border-gray-500', text:'Réduire les glucides, augmenter les légumes et les bonnes graisses. Focus récupération.',
                  meals:[{t:'Matin',d:'Oeufs brouillés (3) + Avocat + Fruit'},{t:'Midi',d:'Poulet + Beaucoup de légumes + Huile d\'olive'},{t:'Soir',d:'Poisson blanc + Légumes vapeurs + Yaourt Grec'}] },
                { title:'1 Entraînement / Jour', border:'border-blue-500', text:'Glucides concentrés autour de l\'entraînement.',
                  meals:[{t:'Matin',d:'Avoine + Whey + Beurre de cacahuète'},{t:'Midi',d:'Riz Basmati (150g) + Dinde + Légumes'},{t:'Post-Training',d:'Banane + Shake'},{t:'Soir',d:'Patate douce + Viande maigre + Salade'}] },
                { title:'2 Entraînements (Eau)', border:'border-cyan-500', text:'Haute dépense. Augmenter les portions de féculents.',
                  meals:[{t:'Matin',d:'Omelette (3 oeufs) + Pain Complet + Fruit'},{t:'Collation',d:'Amandes + Fruit'},{t:'Midi',d:'Pâtes (200g) + Poulet + Légumes'},{t:'Soir',d:'Riz + Saumon + Légumes'}] },
                { title:'Intensif (2 Eau + 1 Muscu)', border:'border-nexus-red', text:'Volume critique. Ne jamais sauter de repas.',
                  meals:[{t:'Matin',d:'Gros bowl Avoine + Whey + Banane + Oeufs'},{t:'Midi',d:'Riz/Pâtes (250g) + Viande Rouge + Légumes'},{t:'Pre-Muscu',d:'Fruit + BCAA'},{t:'Soir',d:'Quinoa + Poisson Gras + Avocat'}] },
                { title:'Jour de Match', border:'border-nexus-gold', text:'Digestion facile. Éviter les graisses et fibres avant match.',
                  meals:[{t:'H-4',d:'Riz blanc + Poulet (sans sauce)'},{t:'H-2',d:'Compote + Barre céréale'},{t:'Mi-Temps',d:'Boisson isotonique + Gel'},{t:'Après-Match',d:'REPAS PLAISIR pour refaire les stocks'}] },
              ].map(({ title, border, text, meals }) => (
                <section key={title}>
                  <h3 className={`text-white font-bold uppercase mb-2 border-l-4 ${border} pl-3`}>{title}</h3>
                  <p className="text-sm text-nexus-gray mb-3">{text}</p>
                  <div className="bg-white/5 p-4 rounded-xl text-sm space-y-2">
                    {meals.map(({ t, d }) => <p key={t}><strong className="text-nexus-gold">{t}:</strong> {d}</p>)}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
