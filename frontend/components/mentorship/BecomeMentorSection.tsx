"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { BadgeCheck, GraduationCap, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDeleteMentorProfile,
  useOwnMentorProfile,
  useSaveMentorProfile,
} from "@/lib/mentorships/hooks";

const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  APPROVED: {
    label: "Approved mentor",
    className: "bg-green-50 text-green-700",
  },
  PENDING: {
    label: "Application under review",
    className: "bg-amber-50 text-amber-700",
  },
  REJECTED: {
    label: "Application not approved",
    className: "bg-red-50 text-red-600",
  },
  DEACTIVATED: {
    label: "Deactivated",
    className: "bg-gray-100 text-gray-600",
  },
};

type Profile = {
  title: string;
  bio: string;
  areas: string[];
  yearsExperience: number;
  availability: string;
  status: string;
};

function MentorProfileForm({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: () => void;
}) {
  const save = useSaveMentorProfile();
  const [title, setTitle] = useState(() => profile?.title ?? "");
  const [areas, setAreas] = useState(() => profile?.areas.join(", ") ?? "");
  const [years, setYears] = useState(() => String(profile?.yearsExperience ?? 0));
  const [availability, setAvailability] = useState(() => profile?.availability ?? "");
  const [bio, setBio] = useState(() => profile?.bio ?? "");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Professional title is required");
      return;
    }
    const areasList = areas
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 10);

    save.mutate(
      {
        title: title.trim(),
        areas: areasList,
        yearsExperience: Math.min(80, Math.max(0, Number(years) || 0)),
        availability: availability.trim(),
        bio: bio.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Mentor profile saved");
          onSaved();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Mentor profile</DialogTitle>
        <DialogDescription>
          Applied profiles are reviewed by the IvomoHub team before you appear
          in mentor search.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="mt-title">Professional title</Label>
          <Input
            id="mt-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Lecturer, Software Engineer…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mt-areas">Areas of expertise</Label>
          <Input
            id="mt-areas"
            value={areas}
            onChange={(e) => setAreas(e.target.value)}
            placeholder="Web Development, Data Science, Research Writing"
          />
          <p className="text-xs text-gray-400">Comma-separated (up to 10).</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mt-years">Years of experience</Label>
            <Input
              id="mt-years"
              type="number"
              min={0}
              max={80}
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mt-availability">Availability</Label>
            <Input
              id="mt-availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="2 hrs/week"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mt-bio">Short bio</Label>
          <Textarea
            id="mt-bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A bit about your background and what you can help with."
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onSaved}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save profile
        </Button>
      </DialogFooter>
    </>
  );
}

export default function BecomeMentorSection() {
  const { data: profile, isLoading } = useOwnMentorProfile();
  const del = useDeleteMentorProfile();

  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    del.mutate(undefined, {
      onSuccess: () => {
        toast.success("Mentor profile removed");
        setConfirmDelete(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const meta = profile ? STATUS_META[profile.status] : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-gradient-to-r from-primary/5 to-transparent p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">
            {profile ? "Your mentor profile" : "Become a mentor"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {profile
              ? `${profile.title} · ${profile.areas.join(", ") || "No areas yet"}`
              : "Share your expertise and mentor students and academics."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {profile && meta ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${meta.className}`}
          >
            {profile.status === "APPROVED" ? (
              <BadgeCheck className="h-3.5 w-3.5" />
            ) : null}
            {meta.label}
          </span>
        ) : null}
        {profile ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={del.isPending}
              title={confirmDelete ? "Click again to confirm" : "Remove profile"}
              className="text-gray-400 hover:text-red-600"
            >
              {del.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => setOpen(true)}>
            Apply to be a mentor
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-auto max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <MentorProfileForm
            key={open ? "open" : "closed"}
            profile={profile ?? null}
            onSaved={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}