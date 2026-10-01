"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BusinessSettings } from "@/lib/types"
import { Shield, Palette, Save, UserRound, AlertCircle, Loader2, Building2 } from "lucide-react"

const EMPTY_BUSINESS: BusinessSettings = {
  legalName: "",
  taxId: "",
  address: "",
  phone: "",
  email: "",
  jurisdiction: "",
}

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { user, refreshUser } = useAuth()
  const isAdmin = user?.role === "admin"

  const [name, setName] = useState(user?.name ?? "")
  const [hotelName, setHotelName] = useState(user?.hotelName ?? "")
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPw, setChangingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const [business, setBusiness] = useState<BusinessSettings>(EMPTY_BUSINESS)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [loadingBusiness, setLoadingBusiness] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setHotelName(user.hotelName ?? "")
    }
  }, [user])

  useEffect(() => {
    let cancelled = false
    if (!isAdmin) return
    setLoadingBusiness(true)
    api.settings
      .get()
      .then((data) => {
        if (!cancelled) setBusiness({ ...EMPTY_BUSINESS, ...data })
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Error al cargar los datos del negocio")
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBusiness(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  async function handleSaveBusiness() {
    setSavingBusiness(true)
    try {
      const saved = await api.settings.update({
        legalName: business.legalName.trim(),
        taxId: business.taxId.trim(),
        address: business.address.trim(),
        phone: business.phone.trim(),
        email: business.email.trim(),
        jurisdiction: business.jurisdiction.trim(),
      })
      setBusiness({ ...EMPTY_BUSINESS, ...saved })
      toast.success("Datos del negocio actualizados")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar los datos del negocio")
    } finally {
      setSavingBusiness(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await api.auth.updateProfile({ name, hotelName: hotelName.trim() || null })
      await refreshUser()
      toast.success("Perfil actualizado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar el perfil")
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setPwError(null)
    if (newPassword.length < 8) {
      setPwError("La nueva contrasena debe tener al menos 8 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("Las contrasenas no coinciden")
      return
    }
    setChangingPw(true)
    try {
      await api.auth.changePassword({ currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Contrasena actualizada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar la contrasena")
    } finally {
      setChangingPw(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuracion</h1>
        <p className="text-muted-foreground text-sm">Perfil, seguridad y apariencia</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="gap-1.5">
            <UserRound className="size-3.5" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="size-3.5" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-1.5">
            <Building2 className="size-3.5" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="size-3.5" />
            Apariencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <UserRound className="size-4" />
                Mi Cuenta
              </CardTitle>
              <CardDescription>Perfil de la sesion actual</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {user?.role}
                  </Badge>
                  {user?.hotelName && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">
                      Hotel: {user.hotelName}
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="profile-name">Nombre</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-hotel">Nombre del Hotel</Label>
                  <Input
                    id="profile-hotel"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="Mi Hotel"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="mr-1 size-4 animate-spin" aria-hidden="true" /> : <Save className="mr-1 size-4" aria-hidden="true" />}
                  Guardar perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="size-4" />
                Cambiar Contrasena
              </CardTitle>
              <CardDescription>Actualiza la contrasena de acceso al sistema</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {pwError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{pwError}</span>
                </div>
              )}
              <div className="grid gap-3 max-w-sm">
                <div className="grid gap-2">
                  <Label htmlFor="pw-current">Contrasena actual</Label>
                  <Input
                    id="pw-current"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pw-new">Nueva contrasena</Label>
                  <Input
                    id="pw-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">Minimo 8 caracteres</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pw-confirm">Confirmar nueva contrasena</Label>
                  <Input
                    id="pw-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleChangePassword} disabled={changingPw}>
                  {changingPw && <Loader2 className="mr-1 size-4 animate-spin" aria-hidden="true" />}
                  Actualizar contrasena
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Building2 className="size-4" />
                Datos del Negocio
              </CardTitle>
              <CardDescription>
                Aparecen en las facturas, vouchers y documentos impressos. Si faltan Razon Social o
                NIF, los comprobantes se emiten sin datos de emisor y puede que no cumplan los
                requisitos fiscales que exija tu pais.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!isAdmin ? (
                <p className="text-sm text-muted-foreground">
                  Solo un administrador puede editar estos datos.
                </p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="biz-legal-name">Razon social</Label>
                      <Input
                        id="biz-legal-name"
                        value={business.legalName}
                        disabled={loadingBusiness}
                        onChange={(e) => setBusiness({ ...business, legalName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="biz-tax-id">NIF / RUC / Identificacion fiscal</Label>
                      <Input
                        id="biz-tax-id"
                        value={business.taxId}
                        disabled={loadingBusiness}
                        onChange={(e) => setBusiness({ ...business, taxId: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="biz-address">Domicilio fiscal</Label>
                      <Input
                        id="biz-address"
                        value={business.address}
                        disabled={loadingBusiness}
                        onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="biz-phone">Telefono</Label>
                      <Input
                        id="biz-phone"
                        value={business.phone}
                        disabled={loadingBusiness}
                        onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="biz-email">Email de contacto</Label>
                      <Input
                        id="biz-email"
                        type="email"
                        value={business.email}
                        disabled={loadingBusiness}
                        onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="biz-jurisdiction">Jurisdiccion / Registro</Label>
                      <Input
                        id="biz-jurisdiction"
                        value={business.jurisdiction}
                        disabled={loadingBusiness}
                        onChange={(e) => setBusiness({ ...business, jurisdiction: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveBusiness} disabled={savingBusiness || loadingBusiness}>
                      {savingBusiness ? (
                        <Loader2 className="mr-1 size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Save className="mr-1 size-4" aria-hidden="true" />
                      )}
                      Guardar datos del negocio
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Palette className="size-4" />
                Apariencia
              </CardTitle>
              <CardDescription>Elige el tema de la aplicacion</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Tema</Label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 rounded-md border-2 p-3 transition-colors ${theme === "light" ? "border-primary" : "border-border hover:border-primary/50"}`}
                >
                  <div className="size-8 rounded-md bg-background border" />
                  <span className="text-xs font-medium text-foreground">Claro</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 rounded-md border-2 p-3 transition-colors ${theme === "dark" ? "border-primary" : "border-border hover:border-primary/50"}`}
                >
                  <div className="size-8 rounded-md bg-foreground" />
                  <span className="text-xs font-medium text-foreground">Oscuro</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 rounded-md border-2 p-3 transition-colors ${theme === "system" ? "border-primary" : "border-border hover:border-primary/50"}`}
                >
                  <div className="size-8 rounded-md bg-gradient-to-br from-background to-foreground" />
                  <span className="text-xs font-medium text-foreground">Sistema</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}