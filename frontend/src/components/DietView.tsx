"use client";

import { motion } from "framer-motion";
import { Utensils, Droplets, CheckCircle2, Apple, UploadCloud, RefreshCw } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useState } from "react";

export function DietView() {
  const { userRole } = useAppContext();
  
  // Mock daily diet plan
  const [meals, setMeals] = useState([
    { id: 1, type: "Breakfast", time: "08:30 AM", food: "Oatmeal with berries", calories: 350, completed: true },
    { id: 2, type: "Lunch", time: "01:00 PM", food: "Grilled chicken salad", calories: 450, completed: false },
    { id: 3, type: "Snack", time: "04:30 PM", food: "Handful of almonds & apple", calories: 200, completed: false },
    { id: 4, type: "Dinner", time: "07:30 PM", food: "Baked salmon with quinoa", calories: 500, completed: false },
  ]);

  const [waterGlasses, setWaterGlasses] = useState(3);
  const waterTarget = 8;

  const toggleMeal = (id: number) => {
    setMeals(meals.map(meal => 
      meal.id === id ? { ...meal, completed: !meal.completed } : meal
    ));
  };

  const progress = Math.round((meals.filter(m => m.completed).length / meals.length) * 100) || 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Diet & Nutrition</h1>
          <p className="text-muted">AI-crafted meal plans and daily hydration tracking.</p>
        </div>
        {userRole === "patient" && (
           <div className="flex gap-2">
             <button className="p-3 rounded-xl bg-surface hover:bg-primary/20 hover:text-primary transition-colors border border-card-border/50 text-muted tooltip-trigger relative group">
               <RefreshCw className="w-5 h-5" />
               <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                 Regenerate Plan
               </div>
             </button>
             <button className="p-3 rounded-xl bg-surface hover:bg-accent/20 hover:text-accent transition-colors border border-card-border/50 text-muted tooltip-trigger relative group">
               <UploadCloud className="w-5 h-5" />
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                 Upload Doctor's Chart
               </div>
             </button>
           </div>
        )}
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diet Progress */}
        <div className="glass-card p-6 flex flex-col justify-center border-t-4 border-t-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              Meal Plan
            </h2>
            <span className="text-2xl font-bold text-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-surface h-3 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-muted mt-3">
             {meals.filter(m => m.completed).length} of {meals.length} meals completed today.
          </p>
        </div>

        {/* Hydration Tracker */}
        <div className="glass-card p-6 flex flex-col justify-center border-t-4 border-t-accent">
           <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-accent" />
              Hydration
            </h2>
            <span className="text-2xl font-bold text-foreground">{waterGlasses} <span className="text-muted text-base font-normal">/ {waterTarget}</span></span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            {[...Array(waterTarget)].map((_, i) => (
              <button
                key={i}
                onClick={() => userRole === 'patient' && setWaterGlasses(i + 1)}
                disabled={userRole !== 'patient'}
                className={`transition-all duration-300 ${
                  i < waterGlasses 
                    ? "text-accent scale-110 drop-shadow-[0_0_8px_rgba(56,217,169,0.5)]" 
                    : "text-surface hover:text-muted"
                }`}
              >
                <Droplets className="w-6 h-6 md:w-8 md:h-8" fill={i < waterGlasses ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
           <p className="text-sm text-muted mt-2 text-center">Glasses of water today</p>
        </div>
      </div>

      {/* Meal List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold pl-2">Today's Meals</h3>
        <div className="grid gap-3">
          {meals.map((meal, index) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-5 flex items-center gap-4 transition-all duration-300 ${
                meal.completed ? "border-primary/30 bg-primary/5" : "hover:border-primary/20"
              }`}
            >
              <div className={`p-3 rounded-full shrink-0 transition-colors ${
                meal.completed ? "bg-primary text-white" : "bg-surface text-muted"
              }`}>
                {meal.type === 'Snack' ? <Apple className="w-6 h-6" /> : <Utensils className="w-6 h-6" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                    meal.completed ? "text-primary" : "text-muted"
                  }`}>{meal.type}</h4>
                  <span className="text-xs font-mono bg-surface px-2 py-0.5 rounded text-muted">
                    {meal.calories} kcal
                  </span>
                </div>
                <h5 className={`text-lg font-medium truncate transition-colors ${
                  meal.completed ? "text-foreground" : ""
                }`}>{meal.food}</h5>
                <div className="text-sm text-muted mt-1">
                  Scheduled for {meal.time}
                </div>
              </div>

              <button
                onClick={() => userRole === 'patient' && toggleMeal(meal.id)}
                disabled={userRole !== 'patient'}
                className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  meal.completed 
                    ? "text-primary hover:bg-primary/10" 
                    : "text-surface hover:text-muted border-2 border-surface hover:border-muted border-dashed"
                }`}
              >
                {meal.completed ? <CheckCircle2 className="w-10 h-10" /> : <div className="w-8 h-8 rounded-full" />}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
