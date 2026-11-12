import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

// Cada ruta es un chunk aparte: solo se descarga cuando el usuario la visita.
const Home = lazy(() => import('./pages/Home'))
const Orders = lazy(() => import('./pages/Orders'))
const Dashboard = lazy(() => import('./pages/Dashboard')) // arrastra recharts (la dependencia más pesada)
const Register = lazy(() => import('./pages/Register'))

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Tienda</Link> · <Link to="/pedidos">Pedidos</Link> · <Link to="/dashboard">Dashboard</Link> · <Link to="/registro">Registro</Link>
      </nav>
      <Suspense fallback={<p role="status">Cargando…</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/registro" element={<Register />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
