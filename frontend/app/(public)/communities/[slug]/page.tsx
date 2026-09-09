import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/connection";
import CommunityHeader from "@/components/communities/CommunityHeader";
import CommunityFeed from "@/components/communities/CommunityFeed";

type CommunityPageProps = {
  params: Promise<{ slug: string }>;
};

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
}: CommunityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await prisma.community.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  return {
    title: community ? `${community.name} – Academia Hub Africa` : "Community",
    description: community?.description,
  };
}

const CommunityPage = async ({ params }: CommunityPageProps) => {
  const { slug } = await params;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        take: 12,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { members: true, documents: true } },
    },
  });

  if (!community) {
    notFound();
  }

  let isMember = false;
  let likedIds: string[] = [];
  let savedIds: string[] = [];

  const where = {
    communityLinks: { some: { communityId: community.id } },
    status: "PUBLISHED" as const,
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { commentRecords: { where: { isHidden: false } } } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.document.count({ where }),
  ]);

  if (userId) {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: community.id, userId },
      },
      select: { id: true },
    });
    isMember = !!membership;

    if (documents.length > 0) {
      const documentIds = documents.map((d) => d.id);
      const [likes, saves] = await Promise.all([
        prisma.like.findMany({
          where: { userId, documentId: { in: documentIds } },
          select: { documentId: true },
        }),
        prisma.save.findMany({
          where: { userId, documentId: { in: documentIds } },
          select: { documentId: true },
        }),
      ]);
      likedIds = likes.map((l) => l.documentId);
      savedIds = saves.map((s) => s.documentId);
    }
  }

  const documentsWithState = documents.map((d) => ({
    ...d,
    isLiked: userId ? likedIds.includes(d.id) : false,
    isSaved: userId ? savedIds.includes(d.id) : false,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-6">
      <CommunityHeader
        community={{
          id: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description,
          image: community.image,
          owner: community.owner,
          _count: community._count,
          createdAt: community.createdAt.toISOString(),
          updatedAt: community.updatedAt.toISOString(),
          ownerId: community.ownerId,
          isMember,
          members: community.members,
        }}
      />

      <CommunityFeed
        slug={community.slug}
        initialDocuments={documentsWithState}
        initialHasMore={documents.length < total}
        isMember={isMember}
      />
    </div>
  );
};

export default CommunityPage;