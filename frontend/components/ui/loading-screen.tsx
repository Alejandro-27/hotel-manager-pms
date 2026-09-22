"use client"

import { Building2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Building2 className="h-6 w-6" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-lg font-semibold text-foreground">HotelManager</div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
      <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
    </div>
  )
}