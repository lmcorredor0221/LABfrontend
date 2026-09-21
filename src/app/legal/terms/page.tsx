import type { Metadata } from "next";
import { LegalDocumentPage, LegalSection } from "@/components/legal/legal-document-page";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y Condiciones de uso de Lean Agent Builder.",
};

export default function TermsPage() {
  return (
    <LegalDocumentPage title="Términos y Condiciones de Uso">
      <p>Al registrarte y utilizar Lean Agent Builder aceptas estos términos. LAB permite validar, diseñar, documentar y preparar la construcción de agentes de IA mediante productos gratuitos y premium claramente identificados dentro de la plataforma.</p>
      <LegalSection title="1. Cuenta y acceso">
        <p>Debes proporcionar información verdadera, proteger tus credenciales y notificar cualquier uso no autorizado. Puedes acceder mediante correo y contraseña o mediante un proveedor de identidad habilitado, como Google.</p>
      </LegalSection>
      <LegalSection title="2. Productos y entregables">
        <p>Blueprint Free entrega el recorrido gratuito descrito en la plataforma. Blueprint Pro y ACP requieren la habilitación comercial correspondiente. La disponibilidad, el progreso y los entregables se muestran dentro del workspace de cada proyecto.</p>
      </LegalSection>
      <LegalSection title="3. Propiedad intelectual">
        <p>Los diseños, artefactos, Blueprints y paquetes ACP generados con la información del usuario pertenecen al usuario o a su organización, sin perjuicio de los derechos sobre la plataforma, sus componentes, métodos y contenidos propios.</p>
      </LegalSection>
      <LegalSection title="4. Uso responsable">
        <p>No debes utilizar LAB para vulnerar derechos, eludir controles, introducir código malicioso o desarrollar usos prohibidos por la ley. Las recomendaciones técnicas deben revisarse antes de llevarlas a producción.</p>
      </LegalSection>
      <LegalSection title="5. Disponibilidad y cambios">
        <p>LAB puede actualizar funciones, límites y documentos para mejorar el servicio. Los cambios materiales se comunicarán por los canales disponibles y una nueva versión podrá requerir aceptación renovada.</p>
      </LegalSection>
    </LegalDocumentPage>
  );
}
