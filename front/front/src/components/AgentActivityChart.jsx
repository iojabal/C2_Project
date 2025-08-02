import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip);

const data = {
  labels: ["03 Wed", "04 Thu", "05 Fri", "06 Sat", "07 Sun", "08 Mon", "09 Tue", "10 Wed", "11 Thu", "12 Fri", "13 Sat", "14 Sun", "15 Mon", "16 Tue"],
  datasets: [
    {
      label: "Comandos enviados",
      data: [30, 40, 45, 50, 48, 65, 60, 25, 40, 38, 32, 28, 40, 55],
      borderColor: "#000000",
      tension: 0.4,
    },
    {
      label: "Respuestas Exitosas",
      data: [25, 30, 35, 40, 38, 50, 48, 20, 35, 34, 28, 26, 32, 40],
      borderColor: "#A0AEC0",
      tension: 0.4,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
  },
};

export default function AgentActivityChart() {
  return <Line data={data} options={options} />;
}
