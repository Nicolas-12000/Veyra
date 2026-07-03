"use client";

import { useState } from "react";
import { ExercisePicker } from "@/src/modules/routines/components/ExercisePicker";
import { SetLogger } from "@/src/modules/sessions/components/SetLogger";
import { Plus } from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

type SetLog = {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number | null;
  notes?: string | null;
  exerciseId: string;
};

interface FreeSessionManagerProps {
  sessionId: string;
  existingSets: SetLog[];
  allExercises: Exercise[];
  unit: "kg" | "lb";
}

export function FreeSessionManager({
  sessionId,
  existingSets,
  allExercises,
  unit,
}: FreeSessionManagerProps) {
  // Determine unique exercises that already have logged sets
  const initialExercises: Exercise[] = [];
  const addedExerciseIds = new Set<string>();

  existingSets.forEach((s) => {
    if (!addedExerciseIds.has(s.exerciseId)) {
      addedExerciseIds.add(s.exerciseId);
      const matched = allExercises.find((e) => e.id === s.exerciseId);
      if (matched) {
        initialExercises.push(matched);
      } else {
        initialExercises.push({
          id: s.exerciseId,
          name: "Ejercicio Desconocido",
          muscleGroup: "core",
        });
      }
    }
  });

  const [activeExercises, setActiveExercises] = useState<Exercise[]>(initialExercises);
  const [pickerOpen, setPickerOpen] = useState(false);

  function handlePickExercise(exercise: Exercise) {
    setPickerOpen(false);
    if (activeExercises.some((e) => e.id === exercise.id)) return;
    setActiveExercises((prev) => [...prev, exercise]);
  }

  return (
    <div className="grid gap-8">
      {activeExercises.map((exercise) => {
        const exerciseSets = existingSets.filter(
          (s) => s.exerciseId === exercise.id
        );
        return (
          <div key={exercise.id}>
            <SetLogger
              sessionId={sessionId}
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              existingSets={exerciseSets}
              targetSets={3}
              targetRepsMin={8}
              targetRepsMax={12}
              unit={unit}
            />
          </div>
        );
      })}

      {activeExercises.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-body text-gray-400 mb-6">
            Aún no has agregado ningún ejercicio a esta sesión libre.
          </p>
          <button
            onClick={() => setPickerOpen(true)}
            className="btn btn-primary inline-flex"
            id="start-free-session-pick"
          >
            <Plus size={16} />
            Agregar ejercicio
          </button>
        </div>
      )}

      {activeExercises.length > 0 && (
        <button
          onClick={() => setPickerOpen(true)}
          className="btn btn-secondary w-full py-3"
          style={{ borderStyle: "dashed" }}
          id="free-session-add-more"
        >
          <Plus size={16} />
          Agregar otro ejercicio
        </button>
      )}

      {pickerOpen && (
        <ExercisePicker
          exercises={allExercises}
          onPick={handlePickExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
