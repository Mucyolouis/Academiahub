import type { Metadata } from "next";
import CommunitiesExplore from "@/components/communities/CommunitiesExplore";

export const metadata: Metadata = {
  title: "Communities – Ivomo Hub Africa",
  description:
    "Discover and join academic communities to share research, papers, and projects.",
};

const CommunitiesPage = () => {
  return <CommunitiesExplore />;
};

export default CommunitiesPage;