import { Birdhouse, Briefcase } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-blue-700 text-white rounded-xl p-2">
        <Briefcase size={20} />
      </div>
      <span className="font-semibold text-xl">Trackr</span>
    </div>
  );
};

export default Logo;
