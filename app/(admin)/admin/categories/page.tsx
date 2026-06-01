import { getCategoriesTree } from "@/lib/db/categories";
import CategoryManager from "./CategoryManager";
import styles from "./Categories.module.css";

export default async function CategoriesPage() {
    const categories = await getCategoriesTree();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Manage Categories</h1>
                <p className={styles.subtitle}>Organize your marketplace structure</p>
            </div>

            <CategoryManager initialCategories={categories} />
        </div>
    );
}
