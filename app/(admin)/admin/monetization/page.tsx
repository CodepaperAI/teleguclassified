import MonetizationManager from "@/components/admin/MonetizationManager";

export const metadata = {
    title: "Monetization Management | Admin",
};

export default function MonetizationPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Monetization Management</h1>
            <MonetizationManager />
        </div>
    );
}
