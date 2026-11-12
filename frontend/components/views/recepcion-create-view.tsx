"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserPlus, Mail, Building2, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export function RecepcionCreateView() {
  const { user } = useAuth()
  const tenantId = user?.tenantId ?? null
  const tenantName = user?.tenantName ?? null

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.auth.createRecepcion({
        name,
        email,
        password,
        ...(tenantId ? { tenantId } : {}),
      })
      setSuccess(true)
      setName("")
      setEmail("")
      setPassword("")
      toast({ title: "Recepcionista creado", description: "El recepcionista ha sido agregado a su hotel" })
    } catch (err) {
      toast({
        title: "Error al crear recepcionista",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!tenantId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crear Recepcionista</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertCircle className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="text-sm">
            No tiene un hotel asignado. Contacte al superadministrador del sistema para que le asigne un hotel.
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Crear Recepcionista</CardTitle>
          </div>
          <CardDescription>
            El recepcionista será asociado a su hotel: <strong>{tenantName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="flex items-start gap-2 rounded-md border border-green/30 bg-green/5 p-3 text-sm text-green">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Recepcionista creado correctamente. Puede iniciar sesión con las credenciales proporcionadas.
              </span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Perez"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo electrónico</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recepcion@hotel.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <p className="text-xs text-muted-foreground">
                El recepcionista podrá cambiar su contraseña después del primer ingreso.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hotel destino</label>
              <Input
                value={tenantName ?? ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Este recepcionista solo tendrá acceso a este hotel.
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || !name || !email || !password}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg aria-hidden="true" className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando...
                </span>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Recepcionista
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
