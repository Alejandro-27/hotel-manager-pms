import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Politica de privacidad",
  description:
    "Como tratamos los datos personales de huespedes, usuarios del sistema y consentimiento para su tratamiento.",
}

export default function PrivacidadPage() {
  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Politica de privacidad
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Version 1.0 - plantilla de trabajo. Debe revisarse y completarse con los datos reales del
          establecimiento antes de publicarse.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">1. Responsable del tratamiento</h2>
        <p className="text-foreground">
          Los datos identificativos del negocio (razon social, identificacion fiscal, domicilio,
          telefono y correo de contacto) se configuran por un administrador del sistema desde{" "}
          <span className="font-medium">Configuracion &gt; Negocio</span> y figuran en las facturas y
          comprobantes emitidos.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">2. Datos que tratamos</h2>
        <ul className="list-disc space-y-1 pl-5 text-foreground marker:text-muted-foreground">
          <li>
            <span className="font-medium">Datos de huespedes:</span> nombre, documento de
            identidad, pais de residencia, email y telefono. El pais, email y telefono son
            opcionales: solo se registran si el huesped los facilita.
          </li>
          <li>
            <span className="font-medium">Datos de la estancia:</span> fechas de entrada y salida,
            numero de huespedes, habitacion asignada y cargos de restaurante.
          </li>
          <li>
            <span className="font-medium">Datos de facturacion:</span> importes, metodos de pago
            y pagos realizados.
          </li>
          <li>
            <span className="font-medium">Datos de usuarios del sistema:</span> nombre, correo
            electronico, perfil y registro de acceso.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">3. Finalidad y base legal</h2>
        <p className="text-foreground">
          Tratamos los datos de huespedes para gestionar la reserva, la estancia, la facturacion y
          el cumplimiento de las obligaciones legales que resulten aplicables. Tratamos los datos de
          usuarios del sistema para permitir el acceso al PMS y garantizar la trazabilidad de las
          operaciones.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">4. Minimizacion de datos</h2>
        <p className="text-foreground">
          El sistema no exige datos que no sean necesarios para la prestacion del servicio. Los
          campos opcionales no se rellenan con valores ficticios: si el huesped no los aporta, se
          almacenan vacios.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">5. Conservacion</h2>
        <p className="text-foreground">
          Los datos se conservan durante el tiempo necesario para las finalidades descritas y, tras
          su finalizacion, durante los plazos exigidos por la normativa aplicable. El plazo concreto
          de conservacion debe documentarse antes de la publicacion definitiva de este documento.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">6. Seguridad</h2>
        <p className="text-foreground">
          El acceso al sistema requiere autenticacion. Las contrasenas se almacenan como hash
          (bcrypt), nunca en texto plano, y las sesiones se mantienen mediante cookies HttpOnly,
          sin exposicion del token en el almacenamiento del navegador. Las copias de seguridad y el
          cifrado en transito dependen de la infraestructura de despliegue.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">7. Derechos del interesado</h2>
        <p className="text-foreground">
          Puede solicitar acceso, rectificacion, supresion, limitacion u oposicion escribiendo al
          correo de contacto indicado en la seccion 1. El sistema permite consultar y modificar los
          datos de huespedes desde su ficha. En el caso de datos sujetos a obligaciones de
          conservacion, la supresion puede no ser procedente.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">8. Mencion a terceros y transferencias</h2>
        <p className="text-foreground">
          El sistema no incorpora analitica ni terceros que capturen datos de los usuarios. Las
          transferencias internacionales, si las hubiera, se realizarian con las garantias
          habituales de proteccion de datos.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">9. Cambios en esta politica</h2>
        <p className="text-foreground">
          Cualquier modificacion sustancial se publicara en esta pagina indicando la fecha de la
          version correspondiente.
        </p>
      </section>

      <p className="border-t pt-4 text-sm text-muted-foreground">
        Consulta tambien nuestros{" "}
        <Link href="/legal/terminos" className="text-primary underline underline-offset-4">
          terminos y condiciones
        </Link>{" "}
        y la{" "}
        <Link href="/legal/reembolsos" className="text-primary underline underline-offset-4">
          politica de cancelacion y reembolsos
        </Link>
        .
      </p>
    </article>
  )
}