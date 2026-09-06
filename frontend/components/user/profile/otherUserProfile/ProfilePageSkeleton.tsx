import { Skeleton } from "@/components/ui/skeleton";

const ProfilePageSkeleton = () => {
  return (
    <>
      {/* ===================== */}
      {/* ProfileSectionOther Skeleton */}
      {/* ===================== */}
      <div className="md:bg-white md:m-4 md:py-6 md:px-4 rounded-2xl">
        {/* Banner */}
        <Skeleton className="h-19.25 lg:h-36.25 w-full rounded-none" />

        <div className="flex gap-4 flex-col md:flex-row">
          {/* Desktop avatar */}
          <Skeleton className="hidden md:block rounded-full h-10 w-10 lg:w-25 lg:h-25 -mt-5" />

          <div className="flex-1 mt-2 lg:mt-6.5">
            {/* Name row + message button */}
            <div className="flex items-center mb-2 justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="md:hidden rounded-full h-10 w-10" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-9 w-23.75 rounded-md" />
            </div>

            {/* Info rows (institution / department) */}
            <div className="flex flex-col md:flex-row gap-4 lg:gap-8">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-44" />
            </div>

            {/* Location */}
            <Skeleton className="h-4 w-36 mt-4 mb-6.5" />

            {/* About me */}
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* Tag Skeleton */}
      {/* ===================== */}
      <div className="flex items-center gap-2 md:mx-4 mb-4">
        <Skeleton className="h-7 w-28" />
      </div>

      {/* ===================== */}
      {/* Publications Grid Skeleton */}
      {/* ===================== */}
      <section className="grid lg:px-6.25 grid-cols-2 gap-2 md:gap-4 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <article
            key={i}
            className="relative w-full bg-white px-1 py-1 lg:py-2.75 lg:px-3 border rounded-[15px] border-[#D9D9D9]"
          >
            {/* Upload icon circle */}
            <Skeleton className="absolute right-3 top-3 md:right-5 md:top-5 rounded-full md:w-11 md:h-11 w-6 h-6" />

            {/* Image */}
            <Skeleton className="rounded-t-[15px] h-[118.48px] sm:h-61.5 w-full" />

            {/* Content */}
            <div className="mt-4 space-y-4">
              {/* Title */}
              <Skeleton className="h-4 w-3/4" />

              {/* Author row */}
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 md:w-10 md:h-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center">
                <div className="flex gap-6">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-5 w-5 rounded-md" />
              </div>

              {/* Button */}
              <Skeleton className="h-8 md:h-9 lg:h-11 w-full rounded-md" />
            </div>
          </article>
        ))}
      </section>
    </>
  );
};

export default ProfilePageSkeleton;
