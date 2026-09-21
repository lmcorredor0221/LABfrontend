import type { Metadata } from "next";
import { LegalDocumentPage, LegalSection } from "@/components/legal/legal-document-page";

export const metadata: Metadata = {
  title: "Política de Privacidad y Cookies",
  description: "Política de privacidad y cookies de Lean Agent Builder.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage title="Política de Privacidad y Cookies">
      <p>Lean Agent Builder trata únicamente la información necesaria para prestar, proteger, medir y mejorar el servicio. Esta política explica las categorías de datos y las decisiones disponibles para cada usuario.</p>
      <LegalSection title="1. Información que tratamos">
        <p>Podemos tratar nombre, correo, preferencias, evidencia de aceptación, información del workspace, diagnósticos y artefactos introducidos o generados durante el uso. Si eliges Google para acceder, recibimos el identificador estable de la cuenta, nombre y correo verificado; no solicitamos acceso a Gmail ni a Drive.</p>
      </LegalSection>
      <LegalSection title="2. Finalidades">
        <p>Usamos los datos para autenticarte, crear y administrar workspaces, ejecutar el funnel de productos, prestar soporte, proteger la plataforma y cumplir obligaciones legales. Las comunicaciones promocionales y la medición opcional dependen de elecciones separadas.</p>
      </LegalSection>
      <LegalSection title="3. Cookies y almacenamiento">
        <p>Utilizamos almacenamiento técnico necesario para sesión, idioma, preferencias y continuidad del diagnóstico. La analítica y la publicidad solamente se activan según la preferencia de consentimiento mostrada en el sitio.</p>
      </LegalSection>
      <LegalSection title="4. Proveedores">
        <p>LAB puede utilizar proveedores de infraestructura, identidad, analítica y pagos para operar el servicio. Cada proveedor recibe únicamente la información necesaria para su función y se mantiene separado del contenido usado para publicidad.</p>
      </LegalSection>
      <LegalSection title="5. Conservación y derechos">
        <p>Conservamos la información durante el tiempo necesario para prestar el servicio, atender obligaciones y resolver controversias. Puedes solicitar acceso, corrección, eliminación o limitación a través de los canales de soporte publicados por LAB.</p>
      </LegalSection>
    </LegalDocumentPage>
  );
}
