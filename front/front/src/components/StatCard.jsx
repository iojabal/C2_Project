import { HiChevronRight } from "react-icons/hi";

const StatCard = ({ title, total, icon, dark = false }) => {
  return (
    <div className={`rounded-2xl px-6 py-4 flex items-center justify-between shadow-md transition-colors duration-200 ${dark ? "bg-gray-900 text-white" : "bg-white"}`}>
      <div className="flex items-center gap-4">
        <div className="bg-gray-800 p-2 rounded-full text-white">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm">{title}</span>
          <span className="text-lg font-bold">Total: {total}</span>
        </div>
      </div>
      <HiChevronRight className="text-white opacity-40" />
    </div>
  );
};

export default StatCard;
