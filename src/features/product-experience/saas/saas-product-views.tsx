"use client";

import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Eye,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/core/i18n/language-context";
import { DiagramCenterPage } from "@/features/diagram-center";
import { byLanguage } from "@/features/product-experience/core/localized-copy";
import type { ProductExperienceRouteSnapshot } from "@/features/product-experience/core/server-state";
import {
  UxaBadge,
  UxaMetricCard,
  UxaProcessingStrip,
  UxaProductHero,
  UxaStickyActionBar,
  UxaSurface,
} from "@/features/product-experience/design-system";
import type { ProductExperienceProductSection } from "@/features/product-experience/shell/experience-model";
import {
  buildProductSaasViewModel,
  formatPercent,
  formatWeeks,
  hasTier,
  type ProductMetric,
} from "@/features/product-experience/saas/saas-product-model";
import { cn } from "@/lib/utils";

type ProductSaasViewProps = {
  activeRoute: ProductExperienceRouteSnapshot | null;
  section: ProductExperienceProductSection;
};

function getHighlightStatusLabel(language: "es" | "en" | "pt", status: string) {
  switch (status) {
    case "ready":
      return byLanguage(language, { en: "Ready", es: "Listo", pt: "Pronto" });
    case "partial":
      return byLanguage(language, { en: "Partial", es: "Parcial", pt: "Parcial" });
    case "blocked":
      return byLanguage(language, { en: "Blocked", es: "Bloqueado", pt: "Bloqueado" });
    default:
      return status;
  }
}

function getToneBadgeLabel(language: "es" | "en" | "pt", tone: "success" | "warning" | "danger" | "info" | "neutral") {
  switch (tone) {
    case "success":
      return byLanguage(language, { en: "Ready", es: "Listo", pt: "Pronto" });
    case "warning":
      return byLanguage(language, { en: "Review", es: "Revisar", pt: "Revisar" });
    case "danger":
      return byLanguage(language, { en: "Blocked", es: "Bloqueado", pt: "Bloqueado" });
    case "info":
      return byLanguage(language, { en: "Info", es: "Info", pt: "Info" });
    default:
      return byLanguage(language, { en: "Pending", es: "Pendiente", pt: "Pendente" });
  }
}

function SectionHeader({
  badge,
  description,
  title,
}: {
  badge: string;
  description: string;
  title: string;
}) {
  const { language } = useLanguage();

  return (
    <UxaProductHero
      description={description}
      eyebrow={<UxaBadge tone="info">{badge}</UxaBadge>}
      headingLevel={2}
      meta={
        <span className="inline-flex items-center gap-2 text-[var(--uxa-font-size-small)] text-[var(--uxa-color-ink-soft)]">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {byLanguage(language, {
            en: "Product experience layer",
            es: "Capa de experiencia del producto",
            pt: "Camada de experiencia do produto",
          })}
        </span>
      }
      title={title}
    />
  );
}

function MetricStrip({ metrics }: { metrics: ProductMetric[] }) {
  const { language } = useLanguage();

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <UxaMetricCard
          description={metric.detail}
          key={metric.key}
          label={
            <span className="inline-flex items-center gap-2">
              {metric.label}
              <UxaBadge tone={metric.tone}>{getToneBadgeLabel(language, metric.tone)}</UxaBadge>
            </span>
          }
          value={metric.value}
        />
      ))}
    </div>
  );
}

function ProductProgressCards({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "blueprint",
  });

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {viewModel.products.map((product) => (
        <a
          className="uxa-card block p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--uxa-shadow-card)]"
          href={product.href}
          key={product.key}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <UxaBadge tone={product.tone}>{product.label}</UxaBadge>
              <p className="mt-3 text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
                {product.detail}
              </p>
            </div>
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 text-[var(--uxa-color-ink-muted)]"
            />
          </div>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
              <span>
                {byLanguage(language, {
                  en: "Progress",
                  es: "Avance",
                  pt: "Avanco",
                })}
              </span>
              <span>{product.progress}%</span>
            </div>
            <UxaProcessingStrip
              label={byLanguage(language, {
                en: `Progress ${product.label}`,
                es: `Avance ${product.label}`,
                pt: `Avanco ${product.label}`,
              })}
              value={product.progress}
            />
          </div>
        </a>
      ))}
    </div>
  );
}

function BlueprintProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "blueprint",
  });

  return (
    <div className="space-y-5">
      <SectionHeader
        badge={byLanguage(language, {
          en: "Product 1 · Blueprint",
          es: "Producto 1 · Blueprint",
          pt: "Produto 1 · Blueprint",
        })}
        description={byLanguage(language, {
          en: "Protected view of the generated end-to-end design. The user can explore value, architecture, and estimates without downloading or extracting content outside the platform.",
          es: "Vista protegida del diseno integral generado. El usuario puede explorar valor, arquitectura y estimacion sin descargar ni extraer contenido fuera de la plataforma.",
          pt: "Vista protegida do design integral gerado. O usuario pode explorar valor, arquitetura e estimativa sem baixar nem extrair conteudo fora da plataforma.",
        })}
        title={byLanguage(language, {
          en: "Blueprint outcome ready to demonstrate value",
          es: "Resultado del Blueprint listo para demostrar valor",
          pt: "Resultado do Blueprint pronto para demonstrar valor",
        })}
      />
      <ProductProgressCards activeRoute={activeRoute} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <UxaBadge tone="success">
                {byLanguage(language, {
                  en: "End-to-end design",
                  es: "Diseno integral",
                  pt: "Design integral",
                })}
              </UxaBadge>
              <h2 className="mt-3 text-[20px] font-black">
                {byLanguage(language, {
                  en: "Core sections",
                  es: "Secciones principales",
                  pt: "Secoes principais",
                })}
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
                {byLanguage(language, {
                  en: "These blocks show the Blueprint scope without enabling export in the free tier.",
                  es: "Estos bloques muestran el alcance del Blueprint sin habilitar exportacion en el nivel gratuito.",
                  pt: "Esses blocos mostram o alcance do Blueprint sem habilitar exportacao no nivel gratuito.",
                })}
              </p>
            </div>
            <Eye
              aria-hidden="true"
              className="h-6 w-6 text-[var(--uxa-color-brand)]"
            />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {viewModel.blueprintHighlights.map((highlight) => (
              <article
                className="rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4"
                key={highlight.key}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-black">{highlight.title}</p>
                  <UxaBadge
                    tone={
                      highlight.status === "ready"
                        ? "success"
                        : highlight.status === "partial"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {getHighlightStatusLabel(language, highlight.status)}
                  </UxaBadge>
                </div>
                <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                  {highlight.detail}
                </p>
              </article>
            ))}
          </div>
        </UxaSurface>
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone="info">Diagram Center v3</UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Centralized governed catalog",
              es: "Catalogo centralizado y gobernado",
              pt: "Catalogo centralizado e governado",
            })}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {byLanguage(language, {
              en: "The full catalog, previews, plan locks, and versions now live in an independent module with server-resolved policies.",
              es: "El catalogo completo, las vistas previas, los bloqueos por plan y las versiones viven ahora en un modulo independiente con politicas resueltas por servidor.",
              pt: "O catalogo completo, as previas, os bloqueios por plano e as versoes agora vivem em um modulo independente com politicas resolvidas no servidor.",
            })}
          </p>
          <a
            className="uxa-button uxa-button--primary mt-5 inline-flex"
            href={`/projects/${activeRoute?.route.sessionId ?? ""}/diagrams`}
          >
            <span>
              {byLanguage(language, {
                en: "Open Diagram Center",
                es: "Abrir Diagram Center",
                pt: "Abrir Diagram Center",
              })}
            </span>
          </a>
        </UxaSurface>
      </div>
      {viewModel.blueprintComparison ? (
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone="success">
            {byLanguage(language, {
              en: "Commercial value",
              es: "Valor comercial",
              pt: "Valor comercial",
            })}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Blueprint vs traditional delivery",
              es: "Blueprint vs desarrollo tradicional",
              pt: "Blueprint vs desenvolvimento tradicional",
            })}
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MetricStrip
              metrics={[
                {
                  detail: byLanguage(language, {
                    en: "Estimated reduction compared with building without structured design.",
                    es: "Reduccion estimada frente a construir sin diseno estructurado.",
                    pt: "Reducao estimada frente a construir sem design estruturado.",
                  }),
                  key: "effort",
                  label: byLanguage(language, {
                    en: "Effort savings",
                    es: "Ahorro esfuerzo",
                    pt: "Economia de esforco",
                  }),
                  tone: "success",
                  value: formatPercent(
                    viewModel.blueprintComparison.effortReductionPercent,
                  ),
                },
                {
                  detail: byLanguage(language, {
                    en: "Cost savings attributed to architectural clarity and lower rework.",
                    es: "Ahorro de costo atribuido a claridad de arquitectura y menor retrabajo.",
                    pt: "Economia de custo atribuida a clareza arquitetural e menor retrabalho.",
                  }),
                  key: "cost",
                  label: byLanguage(language, {
                    en: "Cost savings",
                    es: "Ahorro costo",
                    pt: "Economia de custo",
                  }),
                  tone: "success",
                  value: formatPercent(
                    viewModel.blueprintComparison.costSavingsPercent,
                  ),
                },
                {
                  detail: byLanguage(language, {
                    en: "Estimated delivery time for the Blueprint-assisted scenario.",
                    es: "Tiempo estimado del escenario asistido con Blueprint.",
                    pt: "Tempo estimado do cenario assistido com Blueprint.",
                  }),
                  key: "duration",
                  label: byLanguage(language, {
                    en: "Assisted duration",
                    es: "Duracion asistida",
                    pt: "Duracao assistida",
                  }),
                  tone: "info",
                  value: formatWeeks(
                    viewModel.blueprintComparison.blueprintAssisted
                      .estimated_duration_weeks,
                  ),
                },
              ]}
            />
          </div>
        </UxaSurface>
      ) : null}
      <UxaStickyActionBar
        label={byLanguage(language, {
          en: "Blueprint actions",
          es: "Acciones de Blueprint",
          pt: "Acoes de Blueprint",
        })}
      >
        <a
          className="uxa-button uxa-button--secondary"
          href={`/projects/${activeRoute?.route.sessionId ?? ""}/diagrams`}
        >
          <span>
            {byLanguage(language, {
              en: "Explore diagrams",
              es: "Explorar diagramas",
              pt: "Explorar diagramas",
            })}
          </span>
        </a>
        <a
          className="uxa-button uxa-button--primary"
          href={`/projects/${activeRoute?.route.sessionId ?? ""}/blueprint/pro`}
        >
          <span>
            {byLanguage(language, {
              en: "Get Blueprint Pro",
              es: "Adquirir Blueprint Pro",
              pt: "Adquirir Blueprint Pro",
            })}
          </span>
        </a>
      </UxaStickyActionBar>
    </div>
  );
}

function BlueprintProPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "blueprint_pro",
  });
  const unlocked =
    hasTier(viewModel.accessTier, "blueprint_pro") ||
    viewModel.canDownloadBlueprint;

  return (
    <div className="space-y-5">
      <SectionHeader
        badge={byLanguage(language, {
          en: "Blueprint Professional",
          es: "Blueprint Profesional",
          pt: "Blueprint Profissional",
        })}
        description={byLanguage(language, {
          en: "Turn protected viewing into a downloadable professional deliverable with functional, technical, and commercial documentation, diagrams, and estimates.",
          es: "Convierte la visualizacion protegida en un entregable profesional descargable con documentacion funcional, tecnica, comercial, diagramas y estimacion.",
          pt: "Converte a visualizacao protegida em um entregavel profissional baixavel com documentacao funcional, tecnica, comercial, diagramas e estimativa.",
        })}
        title={
          unlocked
            ? byLanguage(language, {
                en: "Blueprint Pro enabled for this workspace",
                es: "Blueprint Pro habilitado para este workspace",
                pt: "Blueprint Pro habilitado para este workspace",
              })
            : byLanguage(language, {
                en: "Unlock Blueprint Professional",
                es: "Desbloquea el Blueprint Profesional",
                pt: "Desbloqueie o Blueprint Profissional",
              })
        }
      />
      <ProductProgressCards activeRoute={activeRoute} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone={unlocked ? "success" : "warning"}>
            {viewModel.blueprintDownload.label}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Deliverable contents",
              es: "Contenido del entregable",
              pt: "Conteudo do entregavel",
            })}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {viewModel.blueprintDownload.detail}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              byLanguage(language, {
                en: "Architecture, agentic patterns, and orchestration",
                es: "Arquitectura, patrones agentivos y orquestacion",
                pt: "Arquitetura, padroes agenticos e orquestracao",
              }),
              byLanguage(language, {
                en: "Business rules, scope, and success criteria",
                es: "Reglas de negocio, alcance y criterios de exito",
                pt: "Regras de negocio, escopo e criterios de sucesso",
              }),
              byLanguage(language, {
                en: "Minimum tools, contracts, and constraints",
                es: "Herramientas minimas, contratos y restricciones",
                pt: "Ferramentas minimas, contratos e restricoes",
              }),
              byLanguage(language, {
                en: "Memory, RAG, and knowledge strategy",
                es: "Estrategia de memoria, RAG y conocimiento",
                pt: "Estrategia de memoria, RAG e conhecimento",
              }),
              byLanguage(language, {
                en: "Complete versioned diagrams",
                es: "Diagramas completos y versionados",
                pt: "Diagramas completos e versionados",
              }),
              byLanguage(language, {
                en: "Roadmap, effort, cost, ROI, and risks",
                es: "Roadmap, esfuerzo, costo, ROI y riesgos",
                pt: "Roadmap, esforco, custo, ROI e riscos",
              }),
            ].map((item) => (
              <div
                className="flex items-start gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4"
                key={item}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--uxa-state-success)]"
                />
                <p className="text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </UxaSurface>
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone={unlocked ? "success" : "warning"}>
            {unlocked
              ? byLanguage(language, {
                  en: "Available",
                  es: "Disponible",
                  pt: "Disponivel",
                })
              : byLanguage(language, {
                  en: "Upsell",
                  es: "Upsell",
                  pt: "Upsell",
                })}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Protection and permissions",
              es: "Proteccion y permisos",
              pt: "Protecao e permissoes",
            })}
          </h2>
          <div className="mt-5 space-y-3">
            {[
              [
                byLanguage(language, {
                  en: "Current tier",
                  es: "Tier actual",
                  pt: "Tier atual",
                }),
                viewModel.access?.tier_label ?? viewModel.accessTier,
              ],
              [
                byLanguage(language, {
                  en: "Blueprint download",
                  es: "Descarga Blueprint",
                  pt: "Download do Blueprint",
                }),
                viewModel.canDownloadBlueprint
                  ? byLanguage(language, {
                      en: "Enabled",
                      es: "Habilitada",
                      pt: "Habilitado",
                    })
                  : byLanguage(language, {
                      en: "Blocked by product or permission",
                      es: "Bloqueada por producto o permiso",
                      pt: "Bloqueado por produto ou permissao",
                    }),
              ],
              [
                byLanguage(language, {
                  en: "Purchase references",
                  es: "Referencias de compra",
                  pt: "Referencias de compra",
                }),
                String(viewModel.access?.purchase_refs?.length ?? 0),
              ],
              [
                byLanguage(language, {
                  en: "Checkout state",
                  es: "Estado checkout",
                  pt: "Estado do checkout",
                }),
                viewModel.access?.checkout_state ??
                  byLanguage(language, {
                    en: "Not started",
                    es: "No iniciado",
                    pt: "Nao iniciado",
                  }),
              ],
            ].map(([label, value]) => (
              <div
                className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4"
                key={label}
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-[13px] font-black">{value}</p>
              </div>
            ))}
          </div>
        </UxaSurface>
      </div>
      <UxaStickyActionBar
        label={byLanguage(language, {
          en: "Blueprint Pro actions",
          es: "Acciones de Blueprint Profesional",
          pt: "Acoes de Blueprint Profissional",
        })}
      >
        <a
          className="uxa-button uxa-button--secondary"
          href={`/projects/${activeRoute?.route.sessionId ?? ""}/blueprint`}
        >
          <span>
            {byLanguage(language, {
              en: "Back to Blueprint",
              es: "Volver al Blueprint",
              pt: "Voltar ao Blueprint",
            })}
          </span>
        </a>
        <a
          aria-disabled={!unlocked}
          className={cn(
            "uxa-button uxa-button--primary",
            !unlocked && "opacity-80",
          )}
          href={
            unlocked
              ? `/projects/${activeRoute?.route.sessionId ?? ""}/artifacts`
              : `/projects/${activeRoute?.route.sessionId ?? ""}/blueprint/pro`
          }
        >
          <span>
            {unlocked
              ? byLanguage(language, {
                  en: "View artifacts",
                  es: "Ver artefactos",
                  pt: "Ver artefatos",
                })
              : byLanguage(language, {
                  en: "Request access",
                  es: "Solicitar acceso",
                  pt: "Solicitar acesso",
                })}
          </span>
        </a>
      </UxaStickyActionBar>
    </div>
  );
}

function AcpProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const viewModel = buildProductSaasViewModel({ activeRoute, language, section: "acp" });
  const canBuild =
    hasTier(viewModel.accessTier, "acp") ||
    Boolean(viewModel.access?.can_build_acp);

  return (
    <div className="space-y-5">
      <SectionHeader
        badge={byLanguage(language, {
          en: "Product 2 · ACP",
          es: "Producto 2 · ACP",
          pt: "Produto 2 · ACP",
        })}
        description={byLanguage(language, {
          en: "The Agent Construction Package translates the Blueprint into a portable implementation package. It does not replace human environment decisions: it turns them into structured, manageable questions.",
          es: "El Agent Construction Package traduce el Blueprint en un paquete portable de implementacion. No reemplaza decisiones humanas de entorno: las convierte en preguntas estructuradas y gestionables.",
          pt: "O Agent Construction Package traduz o Blueprint em um pacote portavel de implementacao. Ele nao substitui decisoes humanas de ambiente: converte-as em perguntas estruturadas e gerenciaveis.",
        })}
        title={
          canBuild
            ? byLanguage(language, {
                en: "ACP enabled for construction",
                es: "ACP habilitado para construir",
                pt: "ACP habilitado para construir",
              })
            : byLanguage(language, {
                en: "Get ACP to move from design to construction",
                es: "Adquiere ACP para pasar de diseno a construccion",
                pt: "Adquira ACP para passar do design para a construcao",
              })
        }
      />
      <MetricStrip metrics={viewModel.package.metrics} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <UxaSurface
          className={cn(
            "p-[var(--uxa-panel-padding-lg)]",
            !canBuild &&
              "border-[var(--uxa-state-warning)] bg-[var(--uxa-state-warning-bg)]/30",
          )}
        >
          <UxaBadge tone={canBuild ? "success" : "warning"}>
            {canBuild
              ? byLanguage(language, {
                  en: "Active entitlement",
                  es: "Entitlement activo",
                  pt: "Entitlement ativo",
                })
              : byLanguage(language, {
                  en: "Commercial invitation",
                  es: "Invitacion comercial",
                  pt: "Convite comercial",
                })}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Incremental value over Blueprint",
              es: "Valor incremental sobre Blueprint",
              pt: "Valor incremental sobre o Blueprint",
            })}
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              byLanguage(language, {
                en: "Portable declarative specification for different agentic frameworks",
                es: "Especificacion declarativa portable para diferentes frameworks agenticos",
                pt: "Especificacao declarativa portavel para diferentes frameworks agenticos",
              }),
              byLanguage(language, {
                en: "Manifest, contracts, prompts, tools, memory, and test suite ready for development",
                es: "Manifest, contratos, prompts, herramientas, memoria y test suite listos para desarrollo",
                pt: "Manifest, contratos, prompts, ferramentas, memoria e test suite prontos para desenvolvimento",
              }),
              byLanguage(language, {
                en: "Implementation questions with options, impact, and close moment",
                es: "Preguntas de implementacion con opciones, impacto y momento de cierre",
                pt: "Perguntas de implementacao com opcoes, impacto e momento de fechamento",
              }),
              byLanguage(language, {
                en: "Startup guide for Codex, Claude Code, Cursor, Copilot, or another agentic tool",
                es: "Guia de arranque para Codex, Claude Code, Cursor, Copilot u otra herramienta agentica",
                pt: "Guia de arranque para Codex, Claude Code, Cursor, Copilot ou outra ferramenta agentica",
              }),
            ].map((item) => (
              <div
                className="flex items-start gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] bg-white/70 p-4"
                key={item}
              >
                <Boxes
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--uxa-color-brand)]"
                />
                <p className="text-[13px] leading-5 text-[var(--uxa-color-ink-soft)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </UxaSurface>
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone={viewModel.package.blockers.length ? "danger" : "success"}>
            {byLanguage(language, {
                en: "Readiness",
                es: "Preparacion",
                pt: "Prontidao",
              })}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Activation conditions",
              es: "Condiciones para activar",
              pt: "Condicoes para ativar",
            })}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--uxa-color-ink-soft)]">
            {viewModel.package.detail}
          </p>
          <div className="mt-5 space-y-2">
            {viewModel.package.blockers.length ? (
              viewModel.package.blockers.slice(0, 5).map((blocker, index) => (
                <p
                  className="rounded-[var(--uxa-radius-md)] border border-[var(--uxa-state-danger)] bg-white px-3 py-2 text-[12px] text-[var(--uxa-color-ink-soft)]"
                  key={`${blocker}-${index}`}
                >
                  {blocker}
                </p>
              ))
            ) : (
              <p className="rounded-[var(--uxa-radius-md)] bg-[var(--uxa-state-success-bg)] px-3 py-2 text-[12px] text-[var(--uxa-color-ink-soft)]">
                {byLanguage(language, {
                  en: "No technical blockers are declared for showing ACP value.",
                  es: "Sin bloqueos tecnicos declarados para mostrar el valor del ACP.",
                  pt: "Sem bloqueios tecnicos declarados para mostrar o valor do ACP.",
                })}
              </p>
            )}
          </div>
        </UxaSurface>
      </div>
      <UxaStickyActionBar
        label={byLanguage(language, {
          en: "ACP actions",
          es: "Acciones de ACP",
          pt: "Acoes de ACP",
        })}
      >
        <a
          className="uxa-button uxa-button--secondary"
          href={`/projects/${activeRoute?.route.sessionId ?? ""}/work/validate`}
        >
          <span>
            {byLanguage(language, {
              en: "Validate Blueprint",
              es: "Validar Blueprint",
              pt: "Validar Blueprint",
            })}
          </span>
        </a>
        <a
          className="uxa-button uxa-button--primary"
          href={
            canBuild
              ? `/projects/${activeRoute?.route.sessionId ?? ""}/work/package`
              : `/projects/${activeRoute?.route.sessionId ?? ""}/acp`
          }
        >
          <span>
            {canBuild
              ? byLanguage(language, {
                  en: "Generate package",
                  es: "Generar Package",
                  pt: "Gerar Package",
                })
              : byLanguage(language, {
                  en: "Request ACP",
                  es: "Solicitar ACP",
                  pt: "Solicitar ACP",
                })}
          </span>
        </a>
      </UxaStickyActionBar>
    </div>
  );
}

function ArtifactsProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "artifacts",
  });

  return (
    <div className="space-y-5">
      <SectionHeader
        badge={byLanguage(language, {
          en: "Artifacts and versions",
          es: "Artefactos y versiones",
          pt: "Artefatos e versoes",
        })}
        description={byLanguage(language, {
          en: "Documents, journey artifacts, evidence, and available versions for Blueprint and ACP traceability.",
          es: "Documentos, artefactos del journey, evidencia y versiones disponibles para la trazabilidad de Blueprint y ACP.",
          pt: "Documentos, artefatos da jornada, evidencias e versoes disponiveis para a rastreabilidade de Blueprint e ACP.",
        })}
        title={byLanguage(language, {
          en: "Generated deliverables repository",
          es: "Repositorio de entregables generados",
          pt: "Repositorio de entregaveis gerados",
        })}
      />
      <UxaSurface className="overflow-hidden">
        <div className="border-b border-[var(--uxa-color-border)] p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone={viewModel.artifactCards.length ? "success" : "warning"}>
            {viewModel.artifactCards.length}{" "}
            {byLanguage(language, {
              en: "artifacts",
              es: "artefactos",
              pt: "artefatos",
            })}
          </UxaBadge>
        </div>
        <div className="divide-y divide-[var(--uxa-color-border)]">
          {viewModel.artifactCards.map((artifact) => (
            <article
              className="grid gap-3 p-[var(--uxa-panel-padding-lg)] md:grid-cols-[1fr_150px_150px]"
              key={artifact.key}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <UxaBadge tone="info">{artifact.stage}</UxaBadge>
                  <UxaBadge tone="neutral">{artifact.versionLabel}</UxaBadge>
                </div>
                <h2 className="mt-3 text-[15px] font-black">{artifact.label}</h2>
                <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                  {artifact.detail}
                </p>
              </div>
              <p className="text-[12px] font-black text-[var(--uxa-color-ink-soft)]">
                {artifact.exportFormat}
              </p>
              <a
                className="text-[12px] font-black text-[var(--uxa-color-brand)]"
                href={`/projects/${activeRoute?.route.sessionId ?? ""}/diagrams`}
              >
                {byLanguage(language, {
                  en: "View relationships",
                  es: "Ver relaciones",
                  pt: "Ver relacoes",
                })}
              </a>
            </article>
          ))}
          {viewModel.artifactCards.length ? null : (
            <p className="p-[var(--uxa-panel-padding-lg)] text-[13px] text-[var(--uxa-color-ink-soft)]">
              {byLanguage(language, {
                en: "There are no persisted artifacts in the current snapshot yet.",
                es: "Aun no hay artefactos persistidos en el snapshot.",
                pt: "Ainda nao ha artefatos persistidos no snapshot.",
              })}
            </p>
          )}
        </div>
      </UxaSurface>
    </div>
  );
}

function ActivityProductPage({
  activeRoute,
}: {
  activeRoute: ProductExperienceRouteSnapshot | null;
}) {
  const { language } = useLanguage();
  const viewModel = buildProductSaasViewModel({
    activeRoute,
    language,
    section: "activity",
  });
  const snapshot = activeRoute?.snapshot.data ?? null;

  return (
    <div className="space-y-5">
      <SectionHeader
        badge={byLanguage(language, {
          en: "Activity",
          es: "Actividad",
          pt: "Atividade",
        })}
        description={byLanguage(language, {
          en: "Cross-stage timeline to understand what the system did, what is missing, and what requires human intervention.",
          es: "Linea de tiempo transversal para entender que hizo el sistema, que falta y que requiere intervencion humana.",
          pt: "Linha do tempo transversal para entender o que o sistema fez, o que falta e o que requer intervencao humana.",
        })}
        title={byLanguage(language, {
          en: "Project operations and traceability",
          es: "Operacion y trazabilidad del proyecto",
          pt: "Operacao e rastreabilidade do projeto",
        })}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone={viewModel.activityItems.length ? "success" : "neutral"}>
            {byLanguage(language, {
              en: "Timeline",
              es: "Linea de tiempo",
              pt: "Linha do tempo",
            })}
          </UxaBadge>
          <div className="mt-5 space-y-3">
            {viewModel.activityItems.map((item) => (
              <article
                className="flex gap-3 rounded-[var(--uxa-radius-lg)] border border-[var(--uxa-color-border)] p-4"
                key={item.key}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--uxa-color-brand-soft)] text-[var(--uxa-color-brand)]">
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-black">{item.label}</p>
                    <UxaBadge tone={item.tone}>{getToneBadgeLabel(language, item.tone)}</UxaBadge>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--uxa-color-ink-soft)]">
                    {item.detail}
                  </p>
                  {item.time ? (
                    <p className="mt-2 text-[11px] text-[var(--uxa-color-ink-muted)]">
                      {item.time}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
            {viewModel.activityItems.length ? null : (
              <p className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4 text-[13px] text-[var(--uxa-color-ink-soft)]">
                {byLanguage(language, {
                  en: "There are no activity events available in the operational endpoint.",
                  es: "No hay eventos de actividad disponibles en el endpoint operacional.",
                  pt: "Nao ha eventos de atividade disponiveis no endpoint operacional.",
                })}
              </p>
            )}
          </div>
        </UxaSurface>
        <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
          <UxaBadge tone="info">
            {byLanguage(language, {
              en: "Snapshot",
              es: "Snapshot",
              pt: "Snapshot",
            })}
          </UxaBadge>
          <h2 className="mt-3 text-[20px] font-black">
            {byLanguage(language, {
              en: "Operational summary",
              es: "Resumen operativo",
              pt: "Resumo operacional",
            })}
          </h2>
          <div className="mt-5 space-y-3">
            {[
              [
                byLanguage(language, {
                  en: "Current stage",
                  es: "Etapa actual",
                  pt: "Etapa atual",
                }),
                snapshot?.session.current_stage ??
                  byLanguage(language, {
                    en: "Unavailable",
                    es: "No disponible",
                    pt: "Indisponivel",
                  }),
              ],
              [
                byLanguage(language, {
                  en: "Journey artifacts",
                  es: "Artefactos del journey",
                  pt: "Artefatos da jornada",
                }),
                String(snapshot?.journey_artifacts.length ?? 0),
              ],
              [
                byLanguage(language, {
                  en: "Skill runs",
                  es: "Ejecuciones de skills",
                  pt: "Execucoes de skills",
                }),
                String(snapshot?.skill_runs.length ?? 0),
              ],
              [
                byLanguage(language, {
                  en: "Subagent runs",
                  es: "Ejecuciones de subagentes",
                  pt: "Execucoes de subagentes",
                }),
                String(snapshot?.subagent_runs.length ?? 0),
              ],
              [
                byLanguage(language, {
                  en: "Validations",
                  es: "Validaciones",
                  pt: "Validacoes",
                }),
                String(snapshot?.validations?.length ?? 0),
              ],
            ].map(([label, value]) => (
              <div
                className="rounded-[var(--uxa-radius-lg)] bg-[var(--uxa-color-muted-panel)] p-4"
                key={label}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--uxa-color-ink-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-[13px] font-black">{value}</p>
              </div>
            ))}
          </div>
        </UxaSurface>
      </div>
    </div>
  );
}

export function ProductSaasView({
  activeRoute,
  section,
}: ProductSaasViewProps) {
  const { language } = useLanguage();

  if (section === "blueprint") {
    return <BlueprintProductPage activeRoute={activeRoute} />;
  }

  if (section === "blueprint_pro") {
    return <BlueprintProPage activeRoute={activeRoute} />;
  }

  if (section === "diagrams") {
    const projectId = activeRoute?.route.sessionId ?? "";
    return projectId ? <DiagramCenterPage projectId={projectId} /> : null;
  }

  if (section === "acp") {
    return <AcpProductPage activeRoute={activeRoute} />;
  }

  if (section === "artifacts") {
    return <ArtifactsProductPage activeRoute={activeRoute} />;
  }

  if (section === "activity") {
    return <ActivityProductPage activeRoute={activeRoute} />;
  }

  return (
    <UxaSurface className="p-[var(--uxa-panel-padding-lg)]">
      <UxaBadge tone="neutral">
        {byLanguage(language, {
          en: "Product",
          es: "Producto",
          pt: "Produto",
        })}
      </UxaBadge>
      <h2 className="mt-3 text-[20px] font-black">
        {byLanguage(language, {
          en: "Section in preparation",
          es: "Seccion en preparacion",
          pt: "Secao em preparacao",
        })}
      </h2>
      <p className="mt-2 text-[13px] text-[var(--uxa-color-ink-soft)]">
        {byLanguage(language, {
          en: "This section is not yet available for the current project.",
          es: "Esta seccion aun no esta disponible para el proyecto actual.",
          pt: "Esta secao ainda nao esta disponivel para o projeto atual.",
        })}
      </p>
    </UxaSurface>
  );
}
