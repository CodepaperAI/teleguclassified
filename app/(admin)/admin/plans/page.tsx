import { getPlans } from "./actions";
import PlansTable from "@/components/admin/PlansTable";
import styles from "../users/page.module.css"; // Reuse users page styles for consistency

export default async function AdminPlansPage() {
    const plans = await getPlans();

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Plans Management</h1>
                <p className={styles.subtitle}>Create and manage premium subscription plans.</p>
            </div>

            <div className={styles.card}>
                <PlansTable initialPlans={plans} />
            </div>
        </div>
    );
}
