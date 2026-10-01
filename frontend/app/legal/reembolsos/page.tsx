import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cancelacion y reembolsos",
  description: "Politica de cancelacion de reservas y reembolsos aplicable a las estancias.",
}

export default function ReembolsosPage() {
  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Politica de cancelacion y reembolsos
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Version 1.0 - plantilla de trabajo. Debe ajustarse a la politica comercial real del
          establecimiento.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">1. Alcance</h2>
        <p className="text-foreground">
          Esta politica se aplica a las reservas realizadas a traves del sistema HotelManager PMS.
          Los terminos concretos deben figurar en la confirmacion de reserva entregada al huesped.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">2. Plazos de cancelacion</h2>
        <p className="text-foreground">
          <span className="font-medium">Cancelacion con mas de 24 horas</span> de antelacion a la
          fecha de entrada: el anticipo se reembolsara conforme a lo acordado en la reserva.
        </p>
        <p className="text-foreground">
          <span className="font-medium">Cancelacion con menos de 24 horas</span> de antelacion a la
          fecha de entrada: no se reembolsara el anticipo.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">3. No presentacion (No-show)</h2>
        <p className="text-foreground">
          En caso de no presentacion, la reserva se dara por cancelada y se aplicara la penalizacion
          correspondiente de acuerdo con lo establecido para cancelaciones con menos de 24 horas de
          antelacion.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">4. Modificaciones</h2>
        <p className="text-foreground">
          Las solicitudes de cambio de fechas estan sujetas a disponibilidad y a las condiciones
          comerciales vigentes en el momento de la solicitud.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">5. Reembolsos y pagos</h2>
        <p className="text-foreground">
          Los reembolsos se procesaran por el mismo medio de pago utilizado para el anticipo, salvo
          que existiera otra forma de devolucion acordada y documentada. En el sistema se refleja el
          importe del anticipo que debe abonarse en el momento de la confirmacion.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">6. Casos excepcionales</h2>
        <p className="text-foreground">
          El establecimiento podra aplicar criterios excepcionales ante fuerza mayor debidamente
          acreditada. Esta excepcion debe quedar registrada por el personal autorizado.
        </p>
      </section>

      <p className="border-t pt-4 text-sm text-muted-foreground">
        Consulte nuestros{" "}
        <a href="/legal/terminos" className="text-primary underline underline-offset-4">
          terminos y condiciones
        </a>{" "}
        y nuestra{" "}
        <a href="/legal/privacidad" className="text-primary underline underline-offset-4">
          politica de privacidad
        </a>
        .
      </p>
    </article>
  )
}