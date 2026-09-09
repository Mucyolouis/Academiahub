import Link from "next/link";
import { Button } from "@/components/ui/button";

const CommunitiesNotFound = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-32 text-center">
      <h1 className="text-2xl font-semibold leading-[130%]">
        Community not found
      </h1>
      <p className="text-grey mt-2">
        This community may have been removed or the link is incorrect.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="secondary">
          <Link href="/communities">Browse communities</Link>
        </Button>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
};

export default CommunitiesNotFound;