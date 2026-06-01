import styles from "../admin.module.css";
import StatsCards from "@/components/admin/StatsCards";

export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard</h1>
            <StatsCards />
        </div>
    );
}
