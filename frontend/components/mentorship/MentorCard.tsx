"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { MentorProfileListItem } from "@/app/_types/mentorships";
import { useSendMentorshipRequest } from "@/lib/mentorships/hooks";
import { getInitials } from "@/lib/messaging/utils";

export default function MentorCard({ mentor }: { mentor: MentorProfileListItem }) {
  const request = useSendMentorshipRequest();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const canRequest = mentor.relationship === "none";
  const isActive = mentor.relationship === "accepted";

  const handleSubmit = () => {
    if (!topic.trim()) {
      toast.error("Tell the mentor what you'd like help with");
      return;
    }
    request.mutate(
      {
        mentorId: mentor.user.id,
        topic: topic.trim(),
        message: message.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Mentorship request sent");
          setOpen(false);
          setTopic("");
          setMessage("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${mentor.user.id}`}>
          <Avatar className="h-11 w-11 border">
            <AvatarImage
              src={mentor.user.image || undefined}
              alt={mentor.user.name || "mentor"}
            />
            <AvatarFallback>
              {getInitials(mentor.user.name || "")}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${mentor.user.id}`}>
            <p className="font-medium leading-5 truncate hover:underline">
              {mentor.user.name}
            </p>
          </Link>
          <p className="text-sm text-gray-600 truncate">{mentor.title}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {mentor.mentorCount}{" "}
          {mentor.mentorCount === 1 ? "mentee" : "mentees"}
        </span>
      </div>

      {mentor.bio ? (
        <p className="text-sm text-gray-500 line-clamp-3">{mentor.bio}</p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {mentor.areas.map((area) => (
          <span
            key={area}
            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
          >
            {area}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto pt-1">
        <p className="text-xs text-gray-400">
          {mentor.yearsExperience > 0
            ? `${mentor.yearsExperience} yrs experience`
            : "New mentor"}
          {mentor.availability ? ` · ${mentor.availability}` : ""}
        </p>

        {isActive ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <UserCheck className="h-4 w-4" />
            Your mentor
          </span>
        ) : canRequest ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Request mentorship
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Request sent
          </span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-auto max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request mentorship</DialogTitle>
            <DialogDescription>
              Ask {mentor.user.name} to mentor you. Add a topic and why you&apos;d
              like their guidance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="req-topic">What would you like help with?</Label>
              <Input
                id="req-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Research methodology, React, Career advice"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-message">Message (optional)</Label>
              <Textarea
                id="req-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and what you're hoping to achieve."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={request.isPending}
            >
              {request.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}