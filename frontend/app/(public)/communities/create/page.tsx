import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CreateCommunityForm from "@/components/communities/CreateCommunityForm";

export const metadata: Metadata = {
  title: "Create Community – Academia Hub Africa",
  description: "Start a new academic community on Academia Hub Africa.",
};

const CreateCommunityPage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/communities/create");
  }

  return (
    <div className="max-w-xl mx-auto px-4 md:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold leading-[130%]">
          Create a community
        </h1>
        <p className="text-grey mt-1.5">
          Start a space for researchers, students, and faculty to share
          knowledge.
        </p>
      </div>

      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 md:p-8">
        <CreateCommunityForm />
      </div>
    </div>
  );
};

export default CreateCommunityPage;