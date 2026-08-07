"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";

export const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export type StatusFilter = (typeof statusOptions)[number]["value"];

type SearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
};

const Search = ({
  query,
  onQueryChange,
  status,
  onStatusChange,
}: SearchProps) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative w-full bg-white sm:w-10/12 dark:bg-slate-900">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <Input
          type="text"
          placeholder="Search company or role"
          className="pl-9 py-5 shadow-sm shadow-slate-300 dark:shadow-none"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value as StatusFilter)}
      >
        <SelectTrigger className="w-full bg-white py-5 shadow-sm shadow-slate-300 sm:w-45 dark:bg-slate-900 dark:shadow-none">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default Search;
