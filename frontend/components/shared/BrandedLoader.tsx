import Image from "next/image";
import { Loader2 } from "lucide-react";

const BrandedLoader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="relative h-12 w-44 md:h-14 md:w-62">
        <Image
          src="/assets/images/Logoimage.png"
          alt="AcademiaHub"
          fill
          priority
          sizes="(min-width: 768px) 248px, 176px"
        />
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
};

export default BrandedLoader;
