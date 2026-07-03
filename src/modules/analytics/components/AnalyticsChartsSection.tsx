"use client";

import { useState } from "react";
import { OneRMChart } from "./OneRMChart";
import { ExerciseSelector } from "./ExerciseSelector";
import { VolumeByMuscleChart } from "./VolumeByMuscleChart";
import type { OneRMDataPoint, VolumeByMusclePoint } from "@/src/modules/analytics/queries";
import { TrendingUp, BarChart3 } from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

type Props = {
  allExercisesWithData: Exercise[];
  oneRMData: OneRMDataPoint[];
  volumeData: VolumeByMusclePoint[];
  unit: "kg" | "lb";
};

type ChartTab = "onerm" | "volume";

export function AnalyticsChartsSection({ allExercisesWithData, oneRMData, volumeData, unit }: Props) {
  const [activeTab, setActiveTab] = useState<ChartTab>("onerm");
  const [selectedExercises, setSelectedExercises] = useState<string[]>(
    allExercisesWithData.slice(0, 1).map((e) => e.id)
  );

  return (
    <div className="card">
      {/* Tab selector */}
      <div
        className="flex items-center gap-1 mb-6 p-1 w-fit"
        style={{
          background: "var(--color-canvas-overlay)",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <button
          onClick={() => setActiveTab("onerm")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer"
          style={{
            background: activeTab === "onerm" ? "var(--color-canvas-elevated)" : "transparent",
            color: activeTab === "onerm" ? "var(--color-ink)" : "var(--color-ink-muted)",
            border: "none",
          }}
        >
          <TrendingUp size={14} />
          1RM Estimado
        </button>
        <button
          onClick={() => setActiveTab("volume")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer"
          style={{
            background: activeTab === "volume" ? "var(--color-canvas-elevated)" : "transparent",
            color: activeTab === "volume" ? "var(--color-ink)" : "var(--color-ink-muted)",
            border: "none",
          }}
        >
          <BarChart3 size={14} />
          Volumen semanal
        </button>
      </div>

      {activeTab === "onerm" ? (
        <div>
          <div className="mb-6">
            <ExerciseSelector
              exercises={allExercisesWithData}
              selected={selectedExercises}
              onChange={setSelectedExercises}
              maxSelect={3}
            />
          </div>
          <OneRMChart
            data={oneRMData.filter((d) => selectedExercises.includes(d.exerciseId))}
            exerciseIds={selectedExercises}
            unit={unit}
          />
        </div>
      ) : (
        <VolumeByMuscleChart data={volumeData} unit={unit} />
      )}
    </div>
  );
}
