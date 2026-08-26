import DashboardStats from "@/components/DashboardStats";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <DashboardStats />
    </div>
  );
}
