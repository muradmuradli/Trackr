"use client";

import AddApplication from "@/components/dashboard/add-application";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-white w-full flex justify-center">
      <div className="w-7/12 mt-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-semibold">Trackr</h1>
            <span className="text-slate-500 text-sm">
              Your pipeline, from saved roles to signed offers
            </span>
          </div>
          <AddApplication />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
