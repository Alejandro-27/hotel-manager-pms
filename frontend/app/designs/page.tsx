import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const mockups = [
  { src: "/designs/01-sidebar-navigation.jpg", title: "01 - Sidebar / Navegacion Principal" },
  { src: "/designs/02-dashboard-panel-control.jpg", title: "02 - Dashboard / Panel de Control (KPIs + Grafico)" },
  { src: "/designs/03-calendario-reservas-gantt.jpg", title: "03 - Calendario de Reservas (Vista Gantt)" },
  { src: "/designs/04-calendario-modal-nueva-reserva.jpg", title: "04 - Calendario - Modal Nueva Reserva" },
  { src: "/designs/05-huespedes-tabla-principal.jpg", title: "05 - Huespedes y Reservas (Tabla Principal)" },
  { src: "/designs/06-huespedes-wizard-paso1-datos.jpg", title: "06 - Wizard Nueva Reserva - Paso 1: Datos del Huesped" },
  { src: "/designs/07-huespedes-wizard-paso2-habitacion.jpg", title: "07 - Wizard Nueva Reserva - Paso 2: Seleccion de Habitacion" },
  { src: "/designs/08-huespedes-wizard-paso3-pago.jpg", title: "08 - Wizard Nueva Reserva - Paso 3: Pago y Confirmacion" },
  { src: "/designs/09-tpv-punto-de-venta.jpg", title: "09 - TPV Catering - Punto de Venta (Productos + Carrito)" },
  { src: "/designs/10-tpv-inventario.jpg", title: "10 - TPV Catering - Inventario de Productos" },
  { src: "/designs/11-facturacion-tabla.jpg", title: "11 - Facturacion y Pagos (Resumen + Tabla Facturas)" },
  { src: "/designs/12-facturacion-detalle-factura.jpg", title: "12 - Facturacion - Detalle de Factura (Modal)" },
]

export default function DesignsPage() {
  return (
    <main className="min-h-screen bg-background p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mockups - HotelManager PMS & POS
          </h1>
          <p className="text-muted-foreground mt-2">
            12 pantallas de diseno completo del sistema de gestion hotelera. Haz clic en cada imagen para abrirla en
            tamano completo y descargarla.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {mockups.map((mockup, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {mockup.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <a
                  href={mockup.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src={mockup.src}
                    alt={mockup.title}
                    width={1200}
                    height={800}
                    className="w-full h-auto border-t transition-opacity hover:opacity-90"
                  />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Para descargar todas las imagenes, usa el boton de descarga ZIP del proyecto (tres puntos arriba a la derecha).
            Las imagenes estan en <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">public/designs/</code>
          </p>
        </div>
      </div>
    </main>
  )
}
