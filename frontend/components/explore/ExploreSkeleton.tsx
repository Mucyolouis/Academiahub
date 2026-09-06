import { Skeleton } from "@/components/ui/skeleton";

const ExploreSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <article
          key={i}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          {/* Publication Image */}
          <Skeleton className="aspect-4/3 w-full rounded-none" />

          {/* Publication Content */}
          <div className="p-5">
            {/* Title */}
            <Skeleton className="h-6 w-4/5 mb-4.5" />

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>

            {/* View Details Button */}
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </article>
      ))}
    </div>
  );
};

export default ExploreSkeleton;
