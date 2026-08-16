import type { ReactNode } from 'react'
import {
  DoorOpen,
  Users,
  Wrench,
  Sparkles,
} from 'lucide-react'
import type { RoomStatus } from './types'

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
