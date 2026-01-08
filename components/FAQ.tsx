"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  defaultOpen?: number | null;
}

export function FAQ({ items, title = "Frequently Asked Questions", defaultOpen = null }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpenIndex(openIndex === null ? 0 : null)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b"
      >
        <HelpCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <span className="flex-1 font-medium text-gray-900">{title}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${
            openIndex !== null ? "rotate-180" : ""
          }`}
        />
      </button>

      {openIndex !== null && (
        <div className="divide-y">
          {items.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="flex-1 text-sm font-medium text-gray-800">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-3 pb-3 text-sm text-gray-600">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
