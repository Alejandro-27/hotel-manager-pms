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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  CheckCircle2,
  Plus,
  UserPlus,
  Mail,
  Building2,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { PendingRequest, TenantInfo, ApproveRequestInput, CreateTenantInput } from "@/lib/api"

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    activo: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rechazado: "bg-destructive/10 text-destructive border-destructive/20",
    suspendido: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return (
    <Badge variant="secondary" className={variants[status] || "border-none"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export function AdminRequestsView() {
  const { user } = useAuth()
  const isSuperadmin = user?.role === 'superadmin'
  const userTenantId = user?.tenantId ?? null
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [tenants, setTenants] = useState<TenantInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openTenantDialog, setOpenTenantDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [newTenantName, setNewTenantName] = useState("")
  const [newTenantSlug, setNewTenantSlug] = useState("")

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.auth.pendingRequests()
      // Si es admin regular (no superadmin), filtrar solo solicitudes de su tenant
      const filtered = isSuperadmin
        ? data.requests
        : data.requests.filter((r) => r.tenantId === userTenantId)
      setRequests(filtered)
    } catch (err) {
      toast({
        title: "Error al cargar solicitudes",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [isSuperadmin, userTenantId])

  const fetchTenants = useCallback(async () => {
    // Solo superadmin necesita ver todos los tenants
    if (!isSuperadmin) return
    try {
      const data = await api.auth.tenants()
      setTenants(data.tenants)
    } catch {
      // silencioso
    }
  }, [isSuperadmin])

  useEffect(() => {
    fetchRequests()
    if (isSuperadmin) fetchTenants()
  }, [fetchRequests, fetchTenants, isSuperadmin])

  const handleApprove = async (input: ApproveRequestInput) => {
    setSaving(true)
    try {
      await api.auth.approveRequest(input)
      toast({ title: "Solicitud aprobada", description: "El usuario ya puede iniciar sesión" })
      setOpenDialog(false)
      setSelectedRequest(null)
      fetchRequests()
    } catch (err) {
      toast({
        title: "Error al aprobar",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (userId: string) => {
    // Admin regular solo puede rechazar solicitudes de su propio tenant
    if (!isSuperadmin) {
      const reqToReject = requests.find((r) => r.id === userId)
      if (!reqToReject || reqToReject.tenantId !== userTenantId) {
        toast({
          title: "No autorizado",
          description: "Solo puedes rechazar solicitudes de tu propio hotel",
          variant: "destructive",
        })
        return
      }
    }

    setSaving(true)
    try {
      await api.auth.rejectRequest({ userId })
      toast({ title: "Solicitud rechazada", description: "La cuenta ha sido rechazada" })
      fetchRequests()
    } catch (err) {
      toast({
        title: "Error al rechazar",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTenant = async () => {
    setSaving(true)
    try {
      await api.auth.createTenant({ name: newTenantName, slug: newTenantSlug })
      toast({ title: "Hotel creado", description: "El hotel ahora puede asignarse a usuarios" })
      setOpenTenantDialog(false)
      setNewTenantName("")
      setNewTenantSlug("")
      fetchTenants()
      fetchRequests()
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

  const ownTenant = tenants.find((t) => t.id === userTenantId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Solicitudes de cuenta</h1>
          <p className="text-muted-foreground">
            {isSuperadmin
              ? "Revise y apruebe o rechace las cuentas de todos los hoteles."
              : "Revise y apruebe o rechace las cuentas de su hotel."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperadmin && (
            <Button
              onClick={() => setOpenTenantDialog(true)}
              disabled={saving}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Crear Hotel
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {requests.length === 0 && !loading && (
        <Alert>
          <AlertTitle>No hay solicitudes pendientes</AlertTitle>
          <AlertDescription>
            Todas las cuentas han sido revisadas. Los nuevos registros aparecerán aquí para su aprobación.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && requests.length === 0 && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Table */}
      {requests.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol solicitado</TableHead>
              {!isSuperadmin && <TableHead>Hotel (suyo)</TableHead>}
              {isSuperadmin && <TableHead>Hotel</TableHead>}
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{req.name}</TableCell>
                <TableCell>
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> {req.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{req.role}</Badge>
                </TableCell>
                {!isSuperadmin && (
                  <TableCell>{ownTenant?.name || "Sin asignar"}</TableCell>
                )}
                {isSuperadmin && (
                  <TableCell>{req.tenantName || <span className="text-muted-foreground">Sin asignar</span>}</TableCell>
                )}
                <TableCell>
                  {new Date(req.createdAt).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(req)
                      setOpenDialog(true)
                    }}
                    className="w-24"
                  >
                    <UserPlus className="mr-2 h-3 w-3" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm(`¿Rechazar la cuenta de ${req.name} (${req.email})?`)) {
                        handleReject(req.id)
                      }
                    }}
                    className="w-24"
                  >
                    Rechazar
                  </Button>
                </TableCell>
              </TableRow>
              ))}
          </TableBody>
        </Table>
      )}

      {/* Approve Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar solicitud</DialogTitle>
            <DialogDescription>
              Asigne un hotel y un rol a <strong>{selectedRequest?.name}</strong> ({selectedRequest?.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <Select
                  defaultValue={(selectedRequest?.role as "admin" | "recepcion") ?? "recepcion"}
                  onValueChange={(value) => {
                    if (selectedRequest) {
                      setSelectedRequest({ ...selectedRequest, role: value as "admin" | "recepcion" })
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="recepcion">Recepción</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hotel</label>
                {isSuperadmin ? (
                  <Select
                    defaultValue={selectedRequest?.tenantId ?? ""}
                    onValueChange={(value) => {
                      if (selectedRequest) {
                        setSelectedRequest({ ...selectedRequest, tenantId: value })
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center">
                    <Select disabled defaultValue={userTenantId ?? ""}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar hotel" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownTenant && (
                          <SelectItem key={ownTenant.id} value={ownTenant.id}>
                            {ownTenant.name}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <span className="ml-2 text-xs text-muted-foreground">
                      (solo puede asignar a su hotel)
                    </span>
                  </div>
                )}
              </div>
            </div>
            {!isSuperadmin && tenants.length === 0 && !userTenantId && (
              <Alert variant="destructive">
                <AlertTitle>No tiene hotel asignado</AlertTitle>
                <AlertDescription>
                  Contacte al superadministrador para que le asigne un hotel antes de aprobar usuarios.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (selectedRequest && selectedRequest.role && selectedRequest.tenantId) {
                  handleApprove({
                    userId: selectedRequest.id,
                    role: selectedRequest.role as "admin" | "recepcion",
                    tenantId: selectedRequest.tenantId,
                  })
                }
              }}
              disabled={
                saving ||
                !selectedRequest?.role ||
                !selectedRequest?.tenantId ||
                (!isSuperadmin && selectedRequest.tenantId !== userTenantId)
              }
            >
              {saving ? <Loader2 className="mr-2 h-3 w-3" /> : <CheckCircle2 className="mr-2 h-3 w-3" />}
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tenant Dialog (superadmin only) */}
      {isSuperadmin && (
        <Dialog open={openTenantDialog} onOpenChange={setOpenTenantDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear hotel</DialogTitle>
              <DialogDescription>
                Cada usuario debe pertenecer a un hotel. Cree uno antes de aprobar recepciones o administradores de hotel.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault()
              handleCreateTenant()
            }}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del hotel</label>
                <Input
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Ej. Hotel Paraiso"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug (identificador único)</label>
                <Input
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  placeholder="Ej. hotel-paraiso"
                />
              </div>
            </form>
            <DialogFooter>
              <Button onClick={() => setOpenTenantDialog(false)}>Cancelar</Button>
              <Button
                onClick={() => handleCreateTenant()}
                disabled={saving || !newTenantName || !newTenantSlug}
              >
                {saving ? <Loader2 className="mr-2 h-3 w-3" /> : <Plus className="mr-2 h-3 w-3" />}
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
