import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terminos y condiciones",
  description: "Condiciones de uso del sistema HotelManager PMS y sus funcionalidades.",
}

export default function TerminosPage() {
  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Terminos y condiciones</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Version 1.0 - plantilla de trabajo. Debe completarse y aprobarse antes de su
          publicacion definitiva.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">1. Objeto</h2>
        <p className="text-foreground">
          Estos terminos regulan el uso del sistema HotelManager PMS y POS por parte de los usuarios
          autorizados del establecimiento hotelero.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">2. Acceso y cuentas de usuario</h2>
        <p className="text-foreground">
          El acceso al sistema es exclusivo para usuarios autorizados con credenciales personales.
          Cada usuario es responsable de mantener la confidencialidad de su contraseña y de todas
          las actividades realizadas con su cuenta. La contraseña debe tener, como minimo, ocho
          caracteres.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">3. Datos y consentimiento</h2>
        <p className="text-foreground">
          El registro de un nuevo usuario exige aceptar expresamente los terminos y la politica
          de privacidad antes de completar el alta. Al crear una reserva, el sistema exige marcar
          la aceptacion de la politica de cancelacion y reembolsos: la operacion no puede
          completarse sin esa confirmacion.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">4. Uso aceptable</h2>
        <p className="text-foreground">
          El usuario se compromete a utilizar el sistema de forma licita, correcta y conforme a su
          finalidad. No podra realizar acciones destinadas a comprometer la seguridad, el
          rendimiento o la integridad de la informacion.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">5. Propiedad intelectual</h2>
        <p className="text-foreground">
          HotelManager es una aplicacion interna para la gestion del establecimiento. El codigo, el
          diseno y la documentacion son propiedad de sus titulares o se encuentran licenciados para
          su uso interno. No esta autorizado su uso, reproduccion o distribucion fuera del ambito
          autorizado.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">6. Disponibilidad y responsabilidad</h2>
        <p className="text-foreground">
          El sistema puede estar sujeto a interrupciones por mantenimiento, actualizaciones o causas
          ajenas a los responsables. En la medida maxima permitida por la ley, no se asume
          responsabilidad por daños indirectos derivados de su uso.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">7. Modificacion de los terminos</h2>
        <p className="text-foreground">
          Estos terminos podran modificarse cuando resulte necesario. Se publicara la version
          actualizada en esta pagina, indicando la fecha de revision.
        </p>
      </section>

      <p className="border-t pt-4 text-sm text-muted-foreground">
        Revise tambien nuestra{" "}
        <a href="/legal/privacidad" className="text-primary underline underline-offset-4">
          politica de privacidad
        </a>{" "}
        y la{" "}
        <a href="/legal/reembolsos" className="text-primary underline underline-offset-4">
          politica de cancelacion y reembolsos
        </a>
        .
      </p>
    </article>
  )
}