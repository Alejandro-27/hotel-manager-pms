"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Eye, EyeOff, ArrowRight, UserPlus, LogIn, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "@/lib/validations"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"

export function AuthScreen() {
  const { login: doLogin, register: doRegister } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", hotelName: "", password: "", confirmPassword: "" },
  })

  async function handleLogin(data: LoginFormData) {
    setLoginLoading(true)
    setError(null)
    try {
      await doLogin(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion")
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(data: RegisterFormData) {
    setRegisterLoading(true)
    setError(null)
    try {
      await doRegister(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta")
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-20 rounded-full bg-sidebar/10 p-0.5 backdrop-blur-sm">
        <ThemeToggle />
      </div>

      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar text-sidebar-foreground p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-sidebar-accent/30 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-sidebar-accent/20 translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">HotelManager</h1>
              <p className="text-xs text-sidebar-foreground/60">PMS & POS</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-balance">
            Gestiona tu hotel de forma inteligente
          </h2>
          <p className="text-lg text-sidebar-foreground/70 leading-relaxed max-w-md">
            Sistema integral de gestion hotelera con reservas, facturacion, punto de venta y control de inventario en una sola plataforma.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-lg bg-sidebar-accent/40 p-4">
              <p className="text-2xl font-bold">500+</p>
              <p className="text-sm text-sidebar-foreground/60">Hoteles activos</p>
            </div>
            <div className="rounded-lg bg-sidebar-accent/40 p-4">
              <p className="text-2xl font-bold">98%</p>
              <p className="text-sm text-sidebar-foreground/60">Satisfaccion</p>
            </div>
            <div className="rounded-lg bg-sidebar-accent/40 p-4">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm text-sidebar-foreground/60">Soporte tecnico</p>
            </div>
            <div className="rounded-lg bg-sidebar-accent/40 p-4">
              <p className="text-2xl font-bold">+40%</p>
              <p className="text-sm text-sidebar-foreground/60">Eficiencia</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-sidebar-foreground/40">
            &copy; 2026 HotelManager. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right panel - auth forms */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-8 sm:px-8">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">HotelManager</h1>
            <p className="text-xs text-muted-foreground">PMS & POS</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                Iniciar Sesion
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Crear Cuenta
              </TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Tab */}
            <TabsContent value="login">
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground">Bienvenido de nuevo</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Introduce tus credenciales para acceder al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-foreground">Correo electronico</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="admin@hotel.com"
                        {...loginForm.register("email")}
                        autoComplete="email"
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-foreground">Contrasena</Label>
                        <button
                          type="button"
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Olvidaste tu contrasena?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Ingresa tu contrasena"
                          {...loginForm.register("password")}
                          autoComplete="current-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2 h-10"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Accediendo...
                        </span>
                      ) : (
                        <>
                          Iniciar Sesion
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Acceso rapido demo</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-foreground"
                      onClick={() => {
                        setError(null)
                        loginForm.setValue("email", "admin@hotel.com")
                        loginForm.setValue("password", "Admin123!")
                        loginForm.handleSubmit(handleLogin)()
                      }}
                    >
                      Entrar con credenciales demo
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground">Crear cuenta nueva</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Registrate para comenzar a gestionar tu hotel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-name" className="text-foreground">Nombre completo</Label>
                        <Input
                          id="reg-name"
                          placeholder="Juan Perez"
                          {...registerForm.register("name")}
                          autoComplete="name"
                        />
                        {registerForm.formState.errors.name && (
                          <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-hotel" className="text-foreground">Nombre del hotel <span className="text-muted-foreground">(opcional)</span></Label>
                        <Input
                          id="reg-hotel"
                          placeholder="Hotel Sol y Mar"
                          {...registerForm.register("hotelName")}
                        />
                        {registerForm.formState.errors.hotelName && (
                          <p className="text-xs text-destructive">{registerForm.formState.errors.hotelName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="text-foreground">Correo electronico</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="correo@hotel.com"
                        {...registerForm.register("email")}
                        autoComplete="email"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-password" className="text-foreground">Contrasena</Label>
                        <div className="relative">
                          <Input
                            id="reg-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 8 caracteres"
                            {...registerForm.register("password")}
                            autoComplete="new-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {registerForm.formState.errors.password && (
                          <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-confirm" className="text-foreground">Confirmar</Label>
                        <div className="relative">
                          <Input
                            id="reg-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repite la contrasena"
                            {...registerForm.register("confirmPassword")}
                            autoComplete="new-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2 h-10"
                      disabled={registerLoading}
                    >
                      {registerLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creando cuenta...
                        </span>
                      ) : (
                        <>
                          Crear Cuenta
                          <UserPlus className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground leading-relaxed">
                      {"Al crear una cuenta aceptas nuestros "}
                      <button type="button" className="text-primary hover:text-primary/80 underline underline-offset-2">
                        Terminos de servicio
                      </button>
                      {" y "}
                      <button type="button" className="text-primary hover:text-primary/80 underline underline-offset-2">
                        Politica de privacidad
                      </button>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
