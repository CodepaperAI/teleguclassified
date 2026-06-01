import { createAdminClient } from "@/lib/supabase/admin";
import styles from "./details.module.css";
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaLocationDot, FaCircleCheck, FaShieldHalved } from "react-icons/fa6";
import { Card, CardContent } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import VerificationButton from "./VerificationButton";

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = createAdminClient();

    // Fetch profile data
    const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    // Fetch Auth User data (for email & metadata)
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(id);

    if (!profileData && !authUser) return <div>User not found</div>;

    // Combine data - Use authUser meta if profile is missing
    const user = {
        id: id,
        full_name: profileData?.full_name || authUser?.user_metadata?.full_name || "Unknown User",
        email: authUser?.email || "No Email",
        phone: profileData?.phone || authUser?.phone || "N/A",
        avatar_url: profileData?.avatar_url || authUser?.user_metadata?.avatar_url,
        created_at: profileData?.created_at || authUser?.created_at,
        is_verified: profileData?.is_verified,
        is_admin: profileData?.is_admin
    };

    // Helper to format date
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.container}>
            {/* Header Card */}
            <Card className={styles.headerCard}>
                <CardContent className={styles.headerContent}>
                    <div className={styles.avatarWrapper}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name || "User"} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.userName}>{user.full_name}</h2>
                        <p className={styles.userEmail}>{user.email}</p>
                        <div className={styles.badges}>
                            {user.is_verified && (
                                <Badge variant="active" className="gap-1">
                                    <FaCircleCheck size={10} /> Verified
                                </Badge>
                            )}
                            {user.is_admin && (
                                <Badge variant="default" className="gap-1 bg-blue-600 border-blue-600">
                                    <FaShieldHalved size={10} /> Admin
                                </Badge>
                            )}
                            <span className={styles.memberSince}>Member since {user.created_at ? new Date(user.created_at).getFullYear() : "N/A"}</span>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                            <VerificationButton userId={user.id} isVerified={!!user.is_verified} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Details Grid */}
            <div className={styles.grid}>
                <Card>
                    <CardContent className="pt-6">
                        <h3 className={styles.sectionTitle}>Personal Information</h3>
                        <div className={styles.infoList}>
                            <div className={styles.infoItem}>
                                <div className={styles.label}><FaUser /> Full Name</div>
                                <div className={styles.value}>{user.full_name}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.label}><FaEnvelope /> Email Address</div>
                                <div className={styles.value}>{user.email}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.label}><FaPhone /> Phone Number</div>
                                <div className={styles.value}>{user.phone}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <h3 className={styles.sectionTitle}>Account Details</h3>
                        <div className={styles.infoList}>
                            <div className={styles.infoItem}>
                                <div className={styles.label}><FaCalendar /> Joined Date</div>
                                <div className={styles.value}>{formatDate(user.created_at)}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.label}><FaCircleCheck /> Verification Status</div>
                                <div className={styles.value}>
                                    {user.is_verified ? "Verified Identity" : "Unverified"}
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <div className={styles.label}>User ID</div>
                                <div className={styles.valueCode}>{user.id}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
