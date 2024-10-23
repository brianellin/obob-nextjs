"use client";

import React from "react";
import {
  FlameKindling,
  TreePine,
  Trees,
  TentTree,
  MountainSnow,
  BookHeart,
  BookOpenText,
  LucideIcon,
} from "lucide-react";

const icons: LucideIcon[] = [
  FlameKindling,
  TreePine,
  Trees,
  TentTree,
  MountainSnow,
  BookHeart,
  BookOpenText,
];

export default function BackgroundIcons() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => {
          const IconComponent = icons[Math.floor(Math.random() * icons.length)];
          const top = `${Math.random() * 100}%`;
          const left = `${Math.random() * 100}%`;
          let colorClass = "";

          switch (IconComponent) {
            case TreePine:
            case Trees:
              colorClass = [
                "text-green-900",
                "text-green-800",
                "text-green-700",
              ][Math.floor(Math.random() * 3)];
              break;
            case MountainSnow:
              colorClass = "text-gray-600";
              break;
            case TentTree:
              colorClass = "text-amber-900";
              break;
            case FlameKindling:
              colorClass = "text-orange-600";
              break;
            case BookHeart:
              colorClass = "text-pink-400";
              break;
            case BookOpenText:
              colorClass = "text-yellow-400";
              break;
            default:
              colorClass = "text-black";
          }

          return (
            <IconComponent
              key={i}
              className={`h-8 w-8 absolute ${colorClass}`}
              style={{
                top,
                left,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
