import { createContext, useContext } from "react";
import type { FlugMood } from "@/components/pixel/Flug";

export const FlugMoodContext = createContext<{ mood: FlugMood; setMood: (m: FlugMood) => void }>({
  mood: "idle",
  setMood: () => {},
});

export const useFlugMood = () => useContext(FlugMoodContext);
