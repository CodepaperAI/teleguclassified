import { getCMSPageBySlug } from "../actions";
import { notFound } from "next/navigation";
import PageEditor from "./PageEditor";

export default async function AdminEditPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const { slug } = params;
    const page = await getCMSPageBySlug(slug);

    if (!page) {
        notFound();
    }

    return <PageEditor page={page} />;
}
