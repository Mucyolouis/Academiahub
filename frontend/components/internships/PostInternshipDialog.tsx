"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateInternship } from "@/lib/internships/hooks";

export default function PostInternshipDialog() {
  const router = useRouter();
  const create = useCreateInternship();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState<"REMOTE" | "ONSITE" | "HYBRID">("ONSITE");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [stipend, setStipend] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !company.trim() || !description.trim()) {
      toast.error("Title, company and description are required");
      return;
    }
    create.mutate(
      {
        title: title.trim(),
        company: company.trim(),
        description: description.trim(),
        type,
        location: location.trim(),
        duration: duration.trim(),
        stipend: stipend.trim(),
        applicationDeadline: deadline ? new Date(deadline).toISOString() : null,
      },
      {
        onSuccess: (internship) => {
          toast.success("Internship posted");
          setOpen(false);
          setTitle("");
          setCompany("");
          setDescription("");
          setLocation("");
          setDuration("");
          setStipend("");
          setDeadline("");
          router.push(`/internships/${internship.id}`);
          router.refresh();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Post an internship
        </Button>
      </DialogTrigger>
      <DialogContent className="h-auto max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post an internship</DialogTitle>
          <DialogDescription>
            Share an opportunity so students and academics can apply.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="in-title">Title *</Label>
              <Input
                id="in-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Frontend Developer Intern"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="in-company">Company *</Label>
              <Input
                id="in-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                  <SelectItem value="ONSITE">On-site</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="in-location">Location</Label>
              <Input
                id="in-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Nairobi, Kenya"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="in-duration">Duration</Label>
              <Input
                id="in-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="3 months"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="in-stipend">Stipend</Label>
              <Input
                id="in-stipend"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                placeholder="Paid / KES 20,000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="in-deadline">Deadline</Label>
              <Input
                id="in-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="in-desc">Description *</Label>
            <Textarea
              id="in-desc"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role, responsibilities, requirements and how to apply…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending}
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Post internship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}