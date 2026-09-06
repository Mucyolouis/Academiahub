import MainContent from "@/components/user/profile/otherUserProfile/MainContent";
import ProfilePageSkeleton from "@/components/user/profile/otherUserProfile/ProfilePageSkeleton";
import Tag from "@/components/user/profile/otherUserProfile/Tag";
import { Suspense } from "react";

const OtherUserProfilePage = async ({
  params,
}: {
  params: Promise<{ otherUserId: string }>;
}) => {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <MainContent params={params}>
        <Tag />
      </MainContent>
    </Suspense>
  );
};

export default OtherUserProfilePage;
