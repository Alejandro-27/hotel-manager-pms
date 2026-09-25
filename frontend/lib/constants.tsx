import type { ReactNode } from 'react'
import {
  DoorOpen,
  Users,
  Wrench,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { RoomStatus, InvoiceStatus } from './types'

export const roomStatusConfig: Record<RoomStatus, { label: string; className: string; icon: ReactNode }> = {
  libre: { label: 'Libre', className: 'bg-emerald-100 text-emerald-800', icon: <DoorOpen className="size-3" /> },
  ocupada: { label: 'Ocupada', className: 'bg-primary/10 text-primary', icon: <Users className="size-3" /> },
  mantenimiento: { label: 'Mantenimiento', className: 'bg-amber-100 text-amber-800', icon: <Wrench className="size-3" /> },
  limpieza: { label: 'Limpieza', className: 'bg-sky-100 text-sky-800', icon: <Sparkles className="size-3" /> },
}

export const roomTypeLabels: Record<string, string> = {
  individual: 'Individual',
  doble: 'Doble',
  suite: 'Suite',
  familiar: 'Familiar',
}

export const invoiceStatusConfig: Record<InvoiceStatus, { label: string; badgeClass: string; stampClass: string; icon: ReactNode }> = {
  pagada: {
    label: 'Pagada',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    stampClass: 'border-emerald-600 text-emerald-600',
    icon: <CheckCircle2 className="size-3.5" />,
  },
  parcial: {
    label: 'Parcial',
    badgeClass: 'bg-amber-100 text-amber-800',
    stampClass: 'border-amber-600 text-amber-600',
    icon: <Clock className="size-3.5" />,
  },
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-red-100 text-red-800',
    stampClass: 'border-red-600 text-red-600',
    icon: <AlertCircle className="size-3.5" />,
  },
}
