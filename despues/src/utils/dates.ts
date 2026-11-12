import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'

export const timeAgo = (iso: string) => formatDistanceToNow(parseISO(iso), { locale: es, addSuffix: true })
export const longDate = (iso: string) => format(parseISO(iso), "d 'de' MMMM yyyy", { locale: es })
