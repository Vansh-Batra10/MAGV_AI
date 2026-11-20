export function suggestedTemplate(occasion: string): string {
  return ({ birthday: "midnight-birthday", anniversary: "our-year-rewound", christmas: "snow-globe", "new-year": "our-year-rewound", "long-distance": "laal-dhaaga", sorry: "sorry-wala-meter" } as Record<string, string>)[occasion] ?? "quick-surprise";
}
