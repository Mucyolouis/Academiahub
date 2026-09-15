"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptySection from "@/components/user/shared/EmptySection";
import InternshipCard from "@/components/internships/InternshipCard";
import PostInternshipDialog from "@/components/internships/PostInternshipDialog";
import { useInternships } from "@/lib/internships/hooks";

export default function InternshipsPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");

  const { data, isLoading } = useInternships({
    q: query,
    type: type === "ALL" ? undefined : type,
  });

  return (
    <main className="lg:px-6 m-2 lg:m-6 rounded lg:rounded-2xl bg-white lg:py-4 lg:mb-0 py-2">
      <header className="w-full md:bg-white py-2 md:py-7 px-2 md:px-4 mb-2 rounded-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-medium max-sm:text-primary text-2xl">
              Internships
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Discover internship opportunities from companies and universities.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/internships/my-applications">
                <Briefcase className="h-4 w-4" />
                My applications
              </Link>
            </Button>
            <PostInternshipDialog />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-5 max-w-xl">
          <div className="relative flex-1">
            <Search
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, company or location…"
              className="pl-9 text-gray-400 border rounded-xl"
            />
          </div>
          <Select
            value={type}
            onValueChange={(v) => setType(v)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="REMOTE">Remote</SelectItem>
              <SelectItem value="ONSITE">On-site</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : data && data.length === 0 ? (
        <EmptySection
          title="No internships found"
          text="There are no internship listings matching your search. Post one to get the ball rolling!"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 px-2 md:px-4">
          {data?.map((internship) => (
            <InternshipCard key={internship.id} internship={internship} />
          ))}
        </ul>
      )}
    </main>
  );
}