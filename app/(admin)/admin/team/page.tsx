import { getTeamMembers } from "../users/actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-custom/Card";
import TeamList from "@/components/admin/TeamList";
import styles from "./team.module.css";

export default async function TeamPage() {
    const teamMembers = await getTeamMembers();

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Team Management</h1>
                    <p className={styles.description}>Manage your team members and their granular permissions.</p>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    <TeamList initialMembers={teamMembers} />
                </CardContent>
            </Card>
        </div>
    );
}
