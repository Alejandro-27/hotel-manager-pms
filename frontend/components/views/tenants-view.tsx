"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Plus,
  Building2,
  Trash2,
  Edit,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import type { TenantInfo, CreateTenantInput, UpdateTenantInput } from "@/lib/api"

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    activo: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }
  return (
    <Badge variant="secondary" className={variants[status] || "border-none"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export function TenantsView() {
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null)
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.auth.tenants()
      setTenants(data.tenants)
    } catch (err) {
      toast({
        title: "Error al cargar hoteles",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  const handleCreateTenant = async () => {
    setSaving(true)
    try {
      await api.auth.createTenant({ name: newName, slug: newSlug })
      toast({ title: "Hotel creado", description: "El hotel ha sido registrado en el sistema" })
      setOpenDialog(false)
      setNewName("")
      setNewSlug("")
      fetchTenants()
    } catch (err) {
      toast({
        title: "Error al crear hotel",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return
    setSaving(true)
    try {
      await api.auth.updateTenant(selectedTenant.id, { name: editName, slug: editSlug })
      toast({ title: "Hotel actualizado", description: "Los datos del hotel se han guardado" })
      setOpenEditDialog(false)
      setEditName("")
      setEditSlug("")
      setSelectedTenant(null)
      fetchTenants()
    } catch (err) {
      toast({
        title: "Error al actualizar hotel",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return
    setSaving(true)
    try {
      await api.auth.deleteTenant(selectedTenant.id)
      toast({ title: "Hotel eliminado", description: "El hotel ha sido eliminado del sistema" })
      setOpenDeleteDialog(false)
      setSelectedTenant(null)
      fetchTenants()
    } catch (err) {
      toast({
        title: "Error al eliminar hotel",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Hoteles</h1>
          <p className="text-muted-foreground">
            Administre todos los hoteles (tenants) registrados en el sistema.
          </p>
        </div>
        <Button
          onClick={() => setOpenDialog(true)}
          disabled={saving}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Hotel
        </Button>
      </div>

      {/* Empty state */}
      {tenants.length === 0 && !loading && (
        <Alert>
          <AlertTitle>No hay hoteles registrados</AlertTitle>
          <AlertDescription>
            Cree el primer hotel para comenzar a asignar usuarios y administradores.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && tenants.length === 0 && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Table */}
      {tenants.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Hotel</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                <TableCell>
                  <StatusBadge status="activo" />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditName(tenant.name)
                      setEditSlug(tenant.slug)
                      setSelectedTenant(tenant)
                      setOpenEditDialog(true)
                    }}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedTenant(tenant)
                      setOpenDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Hotel</DialogTitle>
            <DialogDescription>
              Cree un nuevo hotel en el sistema. Cada usuario debe pertenecer a un hotel.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault()
            handleCreateTenant()
          }}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del hotel</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Hotel Paraiso"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (identificador único)</label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="Ej. hotel-paraiso"
              />
              <p className="text-xs text-muted-foreground">
                Solo minúsculas, números y guiones. Ej: hotel-paraiso
              </p>
            </div>
          </form>
          <DialogFooter>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => handleCreateTenant()}
              disabled={saving || !newName || !newSlug}
            >
              {saving ? <Loader2 className="mr-2 h-3 w-3" /> : <Plus className="mr-2 h-3 w-3" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Hotel</DialogTitle>
            <DialogDescription>
              Modifique los datos del hotel <strong>{selectedTenant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault()
            handleUpdateTenant()
          }}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del hotel</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Solo minúsculas, números y guiones.
              </p>
            </div>
          </form>
          <DialogFooter>
            <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => handleUpdateTenant()}
              disabled={saving || !editName || !editSlug}
            >
              {saving ? <Loader2 className="mr-2 h-3 w-3" /> : <Edit className="mr-2 h-3 w-3" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Hotel</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar el hotel <strong>{selectedTenant?.name}</strong>?
              Esta acción no se puede deshacer si hay usuarios asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => handleDeleteTenant()}
              disabled={saving}
              variant="destructive"
            >
              {saving ? <Loader2 className="mr-2 h-3 w-3" /> : <Trash2 className="mr-2 h-3 w-3" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
