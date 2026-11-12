import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Orders from './pages/Orders'
import Register from './pages/Register'

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Tienda</Link> · <Link to="/pedidos">Pedidos</Link> · <Link to="/dashboard">Dashboard</Link> · <Link to="/registro">Registro</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registro" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}
