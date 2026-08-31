"use client"

import { useState } from "react"
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardView } from "@/components/views/dashboard-view"
import { CalendarView } from "@/components/views/calendar-view"
import { GuestsView } from "@/components/views/guests-view"
import { PosView } from "@/components/views/pos-view"
import { BillingView } from "@/components/views/billing-view"
import { RoomsView } from "@/components/views/rooms-view"
import { SettingsView } from "@/components/views/settings-view"
import { ReportsView } from "@/components/views/reports-view"
import { AuthScreen } from "@/components/auth-screen"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

const viewTitles: Record<string, string> = {
  dashboard: "Panel de Control",
  calendar: "Calendario de Reservas",
  guests: "Huespedes y Reservas",
  pos: "TPV Catering",
  billing: "Facturacion",
  rooms: "Gestion de Habitaciones",
  settings: "Configuracion",
  reports: "Informes y KPIs",
}

interface AuthUser {
  name: string
  email: string
  role: string
}

export default function Page() {
  const [activeView, setActiveView] = useState("dashboard")
  const [user, setUser] = useState<AuthUser | null>(null)

  if (!user) {
    return <AuthScreen onLogin={setUser} />
  }

  return (
    <SidebarProvider>
      <AppSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        userName={user.name}
        userEmail={user.email}
        onLogout={() => setUser(null)}
      />
      <SidebarInset>
        {/* Top Bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">
                  {viewTitles[activeView] || "Panel de Control"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs text-muted-foreground hidden sm:block">
              {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date())}
            </span>
            <div className="flex items-center gap-2 pl-2 border-l">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block leading-tight">
                <p className="text-xs font-medium text-foreground">{user.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {activeView === "dashboard" && <DashboardView />}
          {activeView === "calendar" && <CalendarView />}
          {activeView === "guests" && <GuestsView />}
          {activeView === "pos" && <PosView />}
          {activeView === "billing" && <BillingView />}
          {activeView === "rooms" && <RoomsView />}
          {activeView === "settings" && <SettingsView />}
          {activeView === "reports" && <ReportsView />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
