"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MobileSearch = ({ placeholder }: { placeholder: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  const commit = (next: string) => {
    if (next === (searchParams.get("search") ?? "")) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next) {
      params.set("search", next);
    } else {
      params.delete("search");
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `?${qs}` : "?");
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => commit(value), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className=" gap-4 h-5.25 mb-4 items-center  flex md:hidden">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(value);
        }}
        className="rounded placeholder:text-[10px] text-[10px]  h-full  "
        placeholder={placeholder}
      />
      <Button
        onClick={() => commit(value)}
        className=" basis-2/10 text-[7px] h-full"
      >
        Search
      </Button>
    </div>
  );
};

export default MobileSearch;
