import { getSettings } from "./actions";
import SettingsForm from "@/components/admin/SettingsForm";
import styles from "./page.module.css";
import { MdSettings } from "react-icons/md";

export default async function SettingsPage() {
    const settings = await getSettings();

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>
                <MdSettings className={styles.titleIcon} />
                Global Settings
            </h1>
            <SettingsForm initialSettings={settings} />
        </div>
    );
}
