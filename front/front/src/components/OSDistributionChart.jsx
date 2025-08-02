import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  labels: ["Windows", "Linux"],
  datasets: [
    {
      data: [70, 30],
      backgroundColor: ["#2563EB", "#A0AEC0"],
      borderWidth: 2,
    },
  ],
};

const options = {
  plugins: {
    legend: {
      position: "bottom",
    },
  },
};

export default function OSDistributionChart() {
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-2">Sistemas Operativos</h3>
      <Doughnut data={data} options={options} />
    </div>
  );
}
