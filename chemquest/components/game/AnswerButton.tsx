"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnswerButtonProps {
  text: string;
  status: "idle" | "correct" | "wrong";
  onClick: () => void;
  disabled?: boolean;
}

export const AnswerButton = ({ text, status, onClick, disabled }: AnswerButtonProps) => {
  // Define the animation variants
  const variants = {
    idle: { scale: 1 },
    correct: { 
      scale: [1, 1.05, 1],
      backgroundColor: "#22c55e", // green-500
      transition: { duration: 0.4 } 
    },
    wrong: { 
      x: [0, -10, 10, -10, 10, 0],
      backgroundColor: "#ef4444", // red-500
      transition: { duration: 0.4 } 
    }
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      animate={status}
      variants={variants}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-4 text-left rounded-xl border-2 transition-colors duration-200 shadow-sm",
        "hover:border-primary/50 focus:outline-none",
        status === "idle" && "bg-card border-border",
        status === "correct" && "text-white border-green-600",
        status === "wrong" && "text-white border-red-600",
        disabled && status === "idle" && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="text-lg font-medium">{text}</span>
    </motion.button>
  );
};
