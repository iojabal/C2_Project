import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Agentes from "./pages/Agentes";
import Consola from "./pages/Consola";
// (Luego creas estas otras páginas)
// const Agentes = () => <h1>Agentes</h1>;
// const Consola = () => <h1>Consola</h1>;
const Historial = () => <h1>Historial</h1>;
const Generar = () => <h1>Generar</h1>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Agentes />} />
          <Route path="agentes" element={<Agentes />} />
          <Route path="consola" element={<Consola />} />
          <Route path="historial" element={<Historial />} />
          <Route path="generar" element={<Generar />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
