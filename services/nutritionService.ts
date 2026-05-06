import { supabase } from '../lib/supabase';
import { FoodItem, MealLog } from '../types';

export async function getFoods(): Promise<FoodItem[]> {
  const { data, error } = await supabase.from('food_items').select('*').order('category').order('name');
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id, name: row.name, category: row.category,
    unit: row.unit, calories: row.calories, protein: row.protein, carbs: row.carbs, fat: row.fat,
  }));
}

export async function getNutritionHistory(athleteId: string): Promise<MealLog[]> {
  const { data, error } = await supabase.from('meal_logs').select('*')
    .eq('athlete_id', athleteId).order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id, date: row.date, type: row.type,
    foods: JSON.parse(row.foods_json ?? '[]'),
    totalCalories: row.total_calories, totalProtein: row.total_protein,
    totalCarbs: row.total_carbs, totalFat: row.total_fat,
  }));
}

export async function logMeal(athleteId: string, meal: MealLog) {
  let cals = 0, pro = 0, carb = 0, fat = 0;
  for (const f of meal.foods) {
    const ratio = f.item.unit === 'piece' ? f.quantity : f.quantity / 100;
    cals += f.item.calories * ratio; pro += f.item.protein * ratio;
    carb += f.item.carbs * ratio; fat += f.item.fat * ratio;
  }
  const { error } = await supabase.from('meal_logs').insert({
    athlete_id: athleteId, date: meal.date, type: meal.type,
    foods_json: JSON.stringify(meal.foods.map(f => ({
      food_id: f.item.id, food_name: f.item.name, quantity: f.quantity,
      unit: f.item.unit, calories: f.item.calories, protein: f.item.protein,
      carbs: f.item.carbs, fat: f.item.fat,
    }))),
    total_calories: Math.round(cals), total_protein: Math.round(pro),
    total_carbs: Math.round(carb), total_fat: Math.round(fat),
  });
  if (error) throw error;
  await supabase.rpc('increment_xp', { p_athlete_id: athleteId, p_xp: 150 });
}

export async function deleteMealLog(mealId: string) {
  const { error } = await supabase.from('meal_logs').delete().eq('id', mealId);
  if (error) throw error;
}