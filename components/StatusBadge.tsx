// components/StatusBadge.tsx
export function StatusBadge({ status }:{ status:"AVAILABLE"|"LOANED"|"LOST"|"REPAIR" }) {
  const cl = status==="AVAILABLE" ? "bg-green-100 text-green-700"
    : status==="LOANED" ? "bg-amber-100 text-amber-700"
    : status==="LOST" ? "bg-red-100 text-red-700"
    : "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-0.5 text-xs rounded ${cl}`}>{status}</span>;
}