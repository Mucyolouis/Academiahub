import Link from "next/link";
import prisma from "@/prisma/connection";
import MentorStatusControls from "../_components/MentorStatusControls";
import AdminDeleteButton from "../_components/AdminDeleteButton";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED", "DEACTIVATED"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

export default async function AdminMentorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const status: StatusFilter = (STATUS_TABS as readonly string[]).includes(
    statusParam ?? "",
  )
    ? (statusParam as StatusFilter)
    : "PENDING";

  const [pendingCount, profiles] = await Promise.all([
    prisma.mentorProfile.count({ where: { status: "PENDING" } }),
    prisma.mentorProfile.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isSuspended: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mentors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} application{pendingCount === 1 ? "" : "s"} awaiting review
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab}
            asChild
            size="sm"
            variant={status === tab ? "default" : "outline"}
          >
            <Link href={`/admin/mentors?status=${tab}`}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Link>
          </Button>
        ))}
      </div>

      {profiles.length === 0 ? (
        <p className="text-sm text-gray-500">
          No {status.toLowerCase()} mentor profiles.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-xl border bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/users/${profile.user.id}`}
                    className="font-medium hover:underline"
                  >
                    {profile.user.name ?? "Unnamed"}
                  </Link>
                  <span className="block text-xs text-gray-400">
                    {profile.user.email}
                  </span>
                  {profile.user.isSuspended ? (
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium">
                      suspended
                    </span>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    profile.status === "APPROVED"
                      ? "bg-green-50 text-green-700"
                      : profile.status === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : profile.status === "REJECTED"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {profile.status}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <p className="font-medium text-gray-800">{profile.title}</p>
                {profile.bio ? (
                  <p className="text-gray-500 line-clamp-3">{profile.bio}</p>
                ) : null}
                <p className="text-xs text-gray-400">
                  {profile.areas ? (
                    <>
                      Areas:{" "}
                      {(() => {
                        try {
                          const areas = JSON.parse(profile.areas);
                          return Array.isArray(areas) ? areas.join(", ") : "";
                        } catch {
                          return "";
                        }
                      })()}
                    </>
                  ) : (
                    "No areas"
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {profile.yearsExperience} yrs experience
                  {profile.availability ? ` · ${profile.availability}` : ""}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <MentorStatusControls profileId={profile.id} status={profile.status} />
                <AdminDeleteButton
                  url={`/api/admin/mentor-profiles/${profile.id}`}
                  label="Remove"
                  confirmMessage={`Remove ${profile.user.name ?? "this user"}'s mentor profile? They will no longer appear as a mentor.`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}