interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  isLoading?: boolean;
  accent?: "brand" | "emerald" | "amber";
}

const accentColors = {
  brand: "border-t-sky-400",
  emerald: "border-t-emerald-400",
  amber: "border-t-amber-400",
};

export function StatCard({ label, value, sub, isLoading, accent }: StatCardProps) {
  return (
    <div
      className={`glass-card p-5 border-t-2 ${
        accent ? accentColors[accent] : "border-t-transparent"
      }`}
    >
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      {isLoading ? (
        <div className="h-8 w-24 rounded-lg bg-gray-800 animate-shimmer mt-1" />
      ) : (
        <p className="text-2xl font-bold text-white font-[var(--font-mono)]">{value}</p>
      )}
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
