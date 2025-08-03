import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AgentsProvider } from "./context/AgentContext";
import Layout from "./components/Layout";
import Agentes from "./pages/Agentes";
import Consola from "./pages/Consola";
const Historial = () => <h1>Historial</h1>;
const Generar   = () => <h1>Generar</h1>;

function App() {
  return (
    <Router>
      {/* Envuelve aquí todo con AgentsProvider */}
      <AgentsProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Agentes />} />
            <Route path="agentes" element={<Agentes />} />
            <Route path="consola"  element={<Consola />} />
            <Route path="historial" element={<Historial />} />
            <Route path="generar"   element={<Generar />} />
          </Route>
        </Routes>
      </AgentsProvider>
    </Router>
  );
}

export default App;
