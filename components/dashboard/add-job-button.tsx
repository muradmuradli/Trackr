"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import JobFormDialog from "@/components/dashboard/job-form-dialog";
import { Plus } from "lucide-react";

const AddJobButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="self-end sm:self-auto">
      <Button
        onClick={() => setOpen(true)}
        className="bg-blue-700 hover:bg-blue-600 hover:text-white text-white px-8 py-5"
      >
        <Plus />
        Add Job
      </Button>
      <JobFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default AddJobButton;
