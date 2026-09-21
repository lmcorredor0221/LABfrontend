import type { Metadata } from "next";
import { LegalDocumentPage, LegalSection } from "@/components/legal/legal-document-page";

export const metadata: Metadata = {
  title: "Política de Tratamiento de Datos",
  description: "Política de tratamiento de datos personales de Lean Agent Builder.",
};

export default function DataTreatmentPage() {
  return (
    <LegalDocumentPage title="Política de Tratamiento de Datos Personales">
      <p>Esta autorización se aplica conforme a la Ley 1581 de 2012 y demás normas colombianas de protección de datos que resulten aplicables.</p>
      <LegalSection title="1. Datos y tratamiento autorizado">
        <p>Autorizas a LAB a recolectar, almacenar, usar, actualizar y proteger tus datos de identificación, contacto, cuenta y operación necesarios para prestar el servicio y administrar la relación con el usuario.</p>
      </LegalSection>
      <LegalSection title="2. Finalidades">
        <p>Las finalidades incluyen autenticación, creación de cuenta y workspace, prestación de productos, soporte, seguridad, facturación, cumplimiento y comunicaciones que hayas elegido recibir.</p>
      </LegalSection>
      <LegalSection title="3. Derechos del titular">
        <p>Puedes conocer, actualizar y rectificar tus datos; solicitar prueba de la autorización; conocer el uso realizado; presentar consultas o reclamos; revocar autorizaciones opcionales y solicitar la supresión cuando legalmente proceda.</p>
      </LegalSection>
      <LegalSection title="4. Datos obligatorios y opcionales">
        <p>Los datos de cuenta y las aceptaciones legales son necesarios para crear y proteger tu acceso. Las comunicaciones comerciales, eventos y boletines son opcionales y pueden modificarse desde las preferencias disponibles.</p>
      </LegalSection>
      <LegalSection title="5. Seguridad y terceros encargados">
        <p>LAB aplica controles técnicos y organizacionales razonables y puede encargar operaciones específicas a proveedores de infraestructura, identidad, analítica o pagos sujetos a obligaciones de confidencialidad y seguridad.</p>
      </LegalSection>
    </LegalDocumentPage>
  );
}
