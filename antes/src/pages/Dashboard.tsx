import _ from 'lodash'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

const sales = [
  { categoria: 'Hogar', total: 420 },
  { categoria: 'Moda', total: 310 },
  { categoria: 'Alimentos', total: 560 },
  { categoria: 'Hogar', total: 180 },
]

export default function Dashboard() {
  const data = _.map(_.groupBy(sales, 'categoria'), (rows, categoria) => ({ categoria, total: _.sumBy(rows, 'total') }))
  return (
    <div>
      <h1>Ventas por categoría</h1>
      <BarChart width={500} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="categoria" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" fill="#2e7d32" />
      </BarChart>
    </div>
  )
}
