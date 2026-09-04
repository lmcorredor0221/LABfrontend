export interface ArticleSection {
  heading: Record<"es" | "en" | "pt", string>;
  content: Record<"es" | "en" | "pt", string>;
}

export interface InsightArticle {
  id: string;
  slug: string;
  sourceDoc: string;
  title: Record<"es" | "en" | "pt", string>;
  category: "architecture" | "memory" | "evaluation" | "security" | "methodology";
  categoryLabel: Record<"es" | "en" | "pt", string>;
  summary: Record<"es" | "en" | "pt", string>;
  readTime: string;
  date: string;
  keyTakeaways: Record<"es" | "en" | "pt", string[]>;
  sections?: ArticleSection[];
}

export const INSIGHTS_ARTICLES: InsightArticle[] = [
  {
    id: "1",
    slug: "patrones-arquitecturas-agenticas-escala",
    sourceDoc: "17_Patrones_de_Arquitecturas_Agénticas_de_IA_y_su_Rol_en_Sistemas_de_Gran_Escala.md",
    category: "architecture",
    readTime: "8 min",
    date: "2026-08-28",
    categoryLabel: {
      es: "Arquitectura",
      en: "Architecture",
      pt: "Arquitetura",
    },
    title: {
      es: "17 Patrones de Arquitecturas Agénticas de IA en Sistemas de Gran Escala",
      en: "17 Agentic AI Architecture Patterns in Large-Scale Systems",
      pt: "17 Padrões de Arquiteturas Agênticas de IA em Sistemas de Grande Escala",
    },
    summary: {
      es: "Guía completa de patrones agénticos: ReAct, Plan-and-Solve, Router-Specialist, Reflexion y Jerarquía Multi-agente, y cuándo elegir cada uno antes de programar.",
      en: "Comprehensive guide to agentic patterns: ReAct, Plan-and-Solve, Router-Specialist, Reflexion, and Multi-agent Hierarchy, and when to pick each before coding.",
      pt: "Guia completo de padrões agênticos: ReAct, Plan-and-Solve, Router-Specialist, Reflexion e Hierarquia Multi-agente, e quando escolher cada um antes de codificar.",
    },
    keyTakeaways: {
      es: [
        "El 80% de los casos de uso empresariales se resuelven con un agente único con herramientas bien tipadas.",
        "Los sistemas multi-agente incrementan el costo de tokens en 3x a 5x; úsalos solo cuando haya especialización real.",
        "Define primero los contratos de herramientas (JSON Schema) antes de seleccionar el framework.",
      ],
      en: [
        "80% of business use cases are solved by a single agent with well-typed tools.",
        "Multi-agent systems increase token costs by 3x to 5x; use them only for genuine specialization.",
        "Define tool contracts (JSON Schema) first before picking the orchestration framework.",
      ],
      pt: [
        "80% dos casos de uso empresariais são resolvidos por um único agente com ferramentas bem tipadas.",
        "Sistemas multi-agente aumentam o custo de tokens em 3x a 5x; use apenas com especialização real.",
        "Defina contratos de ferramentas (JSON Schema) primeiro antes de escolher o framework.",
      ],
    },
    sections: [
      {
        heading: {
          es: "¿Qué define a un sistema agéntico de IA a escala?",
          en: "What defines an enterprise-scale agentic AI system?",
          pt: "O que define um sistema agêntico de IA em escala empresarial?",
        },
        content: {
          es: "A diferencia de un chatbot tradicional que responde a texto en un solo turno, un agente de IA planifica secuencias de acciones, invoca herramientas y APIs externas, mantiene memoria contextual y toma decisiones deterministas con supervisión humana.",
          en: "Unlike traditional chatbots that simply answer in a single turn, an AI agent plans action sequences, executes external API tools, maintains context memory, and makes deterministic decisions with human oversight.",
          pt: "Ao contrário de um chatbot tradicional que apenas responde texto, um agente de IA planeja sequências de ações, invoca ferramentas e APIs, mantém memória e toma decisões determinísticas com supervisão humana.",
        },
      },
      {
        heading: {
          es: "Los 5 Arquetipos Fundamentales",
          en: "The 5 Core Archetypes",
          pt: "Os 5 Arquétipos Fundamentais",
        },
        content: {
          es: "1. ReAct (Reason + Act): Ideal para extracción y razonamiento iterativo.\n2. Router-Specialist: Rutea solicitudes complejas a agentes de dominio.\n3. Plan-and-Solve: Descompone metas complejas en tareas atómicas previas a la ejecución.\n4. Reflexion: Bucles de crítica y auto-corrección determinista.\n5. Supervisor HITL: Orquestación jerárquica con puntos de control humano.",
          en: "1. ReAct (Reason + Act): Ideal for iterative extraction and reasoning.\n2. Router-Specialist: Routes complex queries to specialized domain agents.\n3. Plan-and-Solve: Decomposes complex goals into atomic tasks before execution.\n4. Reflexion: Critique and deterministic self-correction loops.\n5. HITL Supervisor: Hierarchical orchestration with human checkpoints.",
          pt: "1. ReAct (Reason + Act): Ideal para extração e raciocínio iterativo.\n2. Router-Specialist: Roteia consultas para agentes especialistas.\n3. Plan-and-Solve: Decompõe metas complexas em tarefas atômicas.\n4. Reflexion: Loops de crítica e auto-correção.\n5. Supervisor HITL: Orquestração hierárquica com controle humano.",
        },
      },
      {
        heading: {
          es: "Cómo aplicarlo en LAB",
          en: "How to apply this in LAB",
          pt: "Como aplicar no LAB",
        },
        content: {
          es: "El diagnóstico de LAB evalúa automáticamente tu caso y selecciona el arquetipo exacto con menor costo de tokens y menor riesgo operacional antes de generar tu Blueprint y ACP.",
          en: "LAB's diagnosis automatically evaluates your use case and selects the exact archetype with lowest token spend and lowest operational risk before building your Blueprint and ACP.",
          pt: "O diagnóstico do LAB avalia automaticamente seu caso e seleciona o arquétipo exato com menor custo e risco antes de gerar seu Blueprint e ACP.",
        },
      },
    ],
  },
  {
    id: "2",
    slug: "metodologia-agent-construction-package",
    sourceDoc: "Metodologia_Agent_Construction_Package.md",
    category: "methodology",
    readTime: "10 min",
    date: "2026-08-25",
    categoryLabel: {
      es: "Metodología",
      en: "Methodology",
      pt: "Metodologia",
    },
    title: {
      es: "Metodología Agent Construction Package (ACP): De la Idea a la Producción Verificable",
      en: "Agent Construction Package (ACP) Methodology: From Idea to Verifiable Production",
      pt: "Metodologia Agent Construction Package (ACP): Da Ideia à Produção Verificável",
    },
    summary: {
      es: "Por qué los agentes fallan en producción cuando solo se construyen con prompts y cómo un paquete ACP reduce el retrabajo en un 60%.",
      en: "Why agents fail in production when built only on prompts and how an ACP package cuts rework by 60%.",
      pt: "Por que agentes falham em produção quando construídos apenas com prompts e como o pacote ACP reduz retrabalho em 60%.",
    },
    keyTakeaways: {
      es: [
        "Un ACP versiona prompts, esquemas de herramientas, políticas de memoria y guardrails.",
        "Permite que desarrolladores o asistentes de IA (Cursor, Claude Code) implementen sin ambigüedades.",
        "Garantiza gobernanza humana en decisiones críticas mediante disparadores HITL.",
      ],
      en: [
        "An ACP versions prompts, tool schemas, memory policies, and guardrails.",
        "Enables human developers or AI coders (Cursor, Claude Code) to implement without ambiguity.",
        "Guarantees human governance on critical decisions through HITL triggers.",
      ],
      pt: [
        "Um ACP versiona prompts, esquemas de ferramentas, políticas de memória e guardrails.",
        "Permite que desenvolvedores humanos ou codificadores IA implementem sem ambiguidade.",
        "Garante governança humana em decisões críticas através de gatilhos HITL.",
      ],
    },
    sections: [
      {
        heading: {
          es: "El problema de construir agentes solo con prompts",
          en: "The danger of building agents solely on prompts",
          pt: "O problema de construir agentes apenas com prompts",
        },
        content: {
          es: "Construir agentes basándose únicamente en cadenas de prompts sin contratos de esquemas, sin límites de tokens y sin datasets de evaluación provoca fallos catastróficos en producción. Un ACP estructura la arquitectura como ingeniería de software tradicional.",
          en: "Building agents based solely on prompt chains without typed schema contracts, token caps, or evaluation datasets leads to production failures. An ACP structures architecture like traditional software engineering.",
          pt: "Construir agentes baseando-se apenas em prompts sem contratos de esquemas ou limites de tokens provoca falhas em produção. Um ACP estrutura a arquitetura com engenharia de software.",
        },
      },
      {
        heading: {
          es: "Componentes del Paquete ACP",
          en: "Components of the ACP Package",
          pt: "Componentes do Pacote ACP",
        },
        content: {
          es: "• Contratos JSON Schema para cada herramienta externa.\n• Prompts de sistema versionados con delimitadores XML.\n• Datasets sintéticos dorados para pruebas de regresión.\n• Matriz de memoria y políticas de contención de costos.",
          en: "• JSON Schema contracts for every external tool.\n• Versioned system prompts with XML delimiters.\n• Golden synthetic datasets for regression benchmarks.\n• Memory matrix and cost containment policies.",
          pt: "• Contratos JSON Schema para cada ferramenta externa.\n• Prompts de sistema versionados com delimitadores XML.\n• Datasets sintéticos para testes de regressão.\n• Matriz de memória e políticas de custos.",
        },
      },
    ],
  },
  {
    id: "3",
    slug: "gestion-memoria-agentes-ia",
    sourceDoc: "Agentic_Memory_Types,_Management_Strategies,_and_LangGraph_Implementation.md",
    category: "memory",
    readTime: "7 min",
    date: "2026-08-20",
    categoryLabel: {
      es: "Memoria & Contexto",
      en: "Memory & Context",
      pt: "Memória & Contexto",
    },
    title: {
      es: "Estrategias de Memoria para Agentes: Corto Plazo, Semántica y Operacional",
      en: "Agent Memory Strategies: Short-term, Semantic, and Operational Memory",
      pt: "Estratégias de Memória para Agentes: Curto Prazo, Semântica e Operacional",
    },
    summary: {
      es: "Cómo evitar la degradación de contexto y desbordamiento de tokens en ejecuciones largas mediante compresión y memoria basada en entidades.",
      en: "How to avoid context rot and token overflow in long-running executions using entity-based memory and summarization.",
      pt: "Como evitar degradação de contexto e estouro de tokens em execuções longas com memória baseada em entidades.",
    },
    keyTakeaways: {
      es: [
        "El contexto no es almacenamiento infinito: cada turno acumula ruido cognitivo.",
        "Separa el buffer conversacional de la memoria de hechos del negocio.",
        "Usa checkpoints deterministas para recuperar estados de agentes ante fallas.",
      ],
      en: [
        "Context is not infinite storage: every turn accumulates cognitive noise.",
        "Separate the conversation buffer from business facts memory.",
        "Use deterministic checkpoints to recover agent states from failures.",
      ],
      pt: [
        "Contexto não é armazenamento infinito: cada turno acumula ruído cognitivo.",
        "Separe o buffer de conversa da memória de fatos do negócio.",
        "Use checkpoints determinísticos para recuperar estados de agentes.",
      ],
    },
  },
  {
    id: "4",
    slug: "evaluacion-framework-thoughtworks",
    sourceDoc: "Evaluating_AI_agents_in_production_A_practical_framework_-_Thoughtworks.md",
    category: "evaluation",
    readTime: "9 min",
    date: "2026-08-15",
    categoryLabel: {
      es: "Evaluación & Calidad",
      en: "Evaluation & Quality",
      pt: "Avaliação & Qualidade",
    },
    title: {
      es: "Framework Práctico de Evaluación de Agentes de IA en Producción (Thoughtworks)",
      en: "Practical Framework for Evaluating AI Agents in Production (Thoughtworks)",
      pt: "Framework Prático de Avaliação de Agentes de IA em Produção (Thoughtworks)",
    },
    summary: {
      es: "Estrategias cuantitativas para medir precisión de herramientas, adherencia a políticas, contención de costos y estabilidad en ejecuciones multi-turno.",
      en: "Quantitative strategies to measure tool accuracy, policy compliance, cost containment, and multi-turn execution stability.",
      pt: "Estratégias quantitativas para medir precisão de ferramentas, adesão a políticas, contenção de custos e estabilidade.",
    },
    keyTakeaways: {
      es: [
        "El 70% de los errores agénticos se deben a argumentos inválidos en llamadas a herramientas.",
        "Implementa datasets de prueba dorados (golden datasets) antes del despliegue.",
        "Combina jueces LLM independientes con aserciones deterministas de código.",
      ],
      en: [
        "70% of agent errors stem from invalid arguments in tool calls.",
        "Implement golden benchmark datasets prior to deployment.",
        "Combine independent LLM judges with deterministic code assertions.",
      ],
      pt: [
        "70% dos erros agênticos decorrem de argumentos inválidos em chamadas de ferramentas.",
        "Implemente datasets de teste padrão (golden datasets) antes do deploy.",
        "Combine juízes LLM independentes com asserções determinísticas de código.",
      ],
    },
  },
  {
    id: "5",
    slug: "agentes-produccion-framework-10-pasos-amazon",
    sourceDoc: "Agente_de_IA_en_producción_el_framework_de_10_pasos_que_uso_en_Amazon.md",
    category: "methodology",
    readTime: "8 min",
    date: "2026-08-12",
    categoryLabel: {
      es: "Metodología",
      en: "Methodology",
      pt: "Metodologia",
    },
    title: {
      es: "Agentes de IA en Producción: El Framework de 10 Pasos para Despliegue Seguro",
      en: "AI Agents in Production: The 10-Step Safe Deployment Framework",
      pt: "Agentes de IA em Produção: O Framework de 10 Passos para Deploy Seguro",
    },
    summary: {
      es: "Metodología de ciclo de vida agéntico: desde la captura del requerimiento y aislamiento de permisos hasta el monitoreo continuo de tokens y latencia.",
      en: "Agentic lifecycle methodology: from requirements capture and permission isolation to continuous token and latency telemetry.",
      pt: "Metodologia de ciclo de vida agêntico: da captura de requisitos e isolamento de permissões ao monitoramento de tokens.",
    },
    keyTakeaways: {
      es: [
        "Aísla las credenciales de APIs en sidecars o proxies seguros; nunca en el contexto del prompt.",
        "Establece SLAs estrictos de latencia y presupuesto máximo de tokens por sesión.",
        "El diseño previo del blueprint reduce el tiempo de desarrollo en un 50%.",
      ],
      en: [
        "Isolate API credentials in sidecars or secure proxies; never in prompt context.",
        "Set strict latency SLAs and max token budgets per session.",
        "Prior blueprint design cuts development time by 50%.",
      ],
      pt: [
        "Isole credenciais de APIs em sidecars ou proxies seguros; nunca no contexto do prompt.",
        "Estabeleça SLAs rígidos de latência e orçamento máximo de tokens.",
        "O design prévio do blueprint reduz o tempo de desenvolvimento em 50%.",
      ],
    },
  },
  {
    id: "6",
    slug: "descomposicion-tareas-agentes-ia",
    sourceDoc: "Task_Decomposition_for_AI_Agents_How_to_Break_Down_Work_That_Actually_Gets_Done.md",
    category: "architecture",
    readTime: "7 min",
    date: "2026-08-08",
    categoryLabel: {
      es: "Arquitectura",
      en: "Architecture",
      pt: "Arquitetura",
    },
    title: {
      es: "Descomposición de Tareas para Agentes de IA: Cómo Dividir el Trabajo para que Realmente se Ejecute",
      en: "Task Decomposition for AI Agents: How to Break Down Work That Actually Gets Done",
      pt: "Decomposição de Tarefas para Agentes de IA: Como Dividir o Trabalho para Execução Real",
    },
    summary: {
      es: "Técnicas de descomposición jerárquica y secuencial para evitar alucinaciones en flujos de negocio complejos con múltiples pasos.",
      en: "Hierarchical and sequential decomposition techniques to eliminate hallucinations in multi-step complex workflows.",
      pt: "Técnicas de decomposição hierárquica e sequencial para evitar alucinações em fluxos complexos.",
    },
    keyTakeaways: {
      es: [
        "Los agentes rinden mejor cuando cada paso genera un artefacto verificable intermedio.",
        "Evita pedir al modelo que planifique y ejecute 10 herramientas simultáneamente en un solo turno.",
        "Usa arquetipos router-worker para delegar subtareas delimitadas.",
      ],
      en: [
        "Agents perform best when each step generates a verifiable intermediate artifact.",
        "Avoid asking the model to plan and execute 10 tools simultaneously in a single turn.",
        "Use router-worker archetypes to delegate scoped subtasks.",
      ],
      pt: [
        "Agentes têm melhor desempenho quando cada etapa gera um artefato intermediário verificável.",
        "Evite pedir ao modelo para planejar e executar 10 ferramentas simultaneamente.",
        "Use arquétipos router-worker para delegar subtarefas delimitadas.",
      ],
    },
  },
  {
    id: "7",
    slug: "patron-reflexion-auto-correccion-agentes",
    sourceDoc: "Self-Correcting_Agents_The_Reflection_Pattern_Guide_-_Fast.io.md",
    category: "architecture",
    readTime: "6 min",
    date: "2026-08-04",
    categoryLabel: {
      es: "Arquitectura",
      en: "Architecture",
      pt: "Arquitetura",
    },
    title: {
      es: "Patrón de Reflexión y Auto-Corrección: Mejorando la Precisión Agéntica sin Reentrenar",
      en: "Reflection and Self-Correction Pattern: Improving Agentic Accuracy Without Retraining",
      pt: "Padrão de Reflexão e Auto-Correção: Melhorando a Precisão Agêntica sem Re-treinamento",
    },
    summary: {
      es: "Cómo implementar bucles de crítica y auto-corrección determinista (Reflexion) para elevar la tasa de éxito de tareas del 65% al 93%.",
      en: "How to implement critique and deterministic self-correction loops (Reflexion) to boost task success rates from 65% to 93%.",
      pt: "Como implementar loops de crítica e auto-correção determinística para elevar o sucesso de 65% para 93%.",
    },
    keyTakeaways: {
      es: [
        "La auto-reflexión requiere un crítico con rúbrica explícita, no un prompt genérico de 'revisa tu respuesta'.",
        "Limita el número máximo de reintentos a 2 o 3 para evitar consumo descontrolado de tokens.",
        "Guarda el historial de fallos para informar los guardrails del ACP.",
      ],
      en: [
        "Self-reflection requires an explicit rubric critique, not a generic 'check your work' prompt.",
        "Cap maximum retry attempts at 2 or 3 to prevent runaway token spend.",
        "Store failure history to inform the ACP guardrails.",
      ],
      pt: [
        "A auto-reflexão requer um crítico com rubrica explícita, não um prompt genérico.",
        "Limite o número máximo de tentativas em 2 ou 3 para evitar consumo descontrolado de tokens.",
        "Armazene o histórico de falhas para alimentar os guardrails do ACP.",
      ],
    },
  },
  {
    id: "8",
    slug: "langgraph-vs-crewai-vs-autogen-2026",
    sourceDoc: "LangGraph_vs_CrewAI_vs_AutoGen_The_Complete_Multi-Agent_AI_Orchestration_Guide_for_2026_-_DEV_Commun.md",
    category: "architecture",
    readTime: "9 min",
    date: "2026-07-30",
    categoryLabel: {
      es: "Arquitectura",
      en: "Architecture",
      pt: "Arquitetura",
    },
    title: {
      es: "LangGraph vs CrewAI vs AutoGen: Guía Completa de Orquestación Multi-Agente 2026",
      en: "LangGraph vs CrewAI vs AutoGen: Complete Multi-Agent AI Orchestration Guide 2026",
      pt: "LangGraph vs CrewAI vs AutoGen: Guia Completo de Orquestração Multi-Agente 2026",
    },
    summary: {
      es: "Comparativa técnica exhaustiva: control de estado determinista, facilidad de depuración, soporte de streaming y costo operacional de cada framework.",
      en: "Exhaustive technical benchmark: deterministic state control, debuggability, streaming support, and operational costs per framework.",
      pt: "Comparativo técnico detalhado: controle de estado determinístico, depuração, streaming e custos operacionais.",
    },
    keyTakeaways: {
      es: [
        "LangGraph destaca en flujos cíclicos con control de estado y persistencia determinista.",
        "CrewAI es ideal para prototipado rápido de roles basados en perfiles.",
        "Un ACP bien diseñado permite implementar en cualquiera de estos frameworks sin rehacer la arquitectura.",
      ],
      en: [
        "LangGraph excels in cyclic workflows with state control and deterministic persistence.",
        "CrewAI is best for rapid role-based persona prototyping.",
        "A well-designed ACP allows implementation across any framework without re-architecting.",
      ],
      pt: [
        "LangGraph se destaca em fluxos cíclicos com controle de estado e persistência determinística.",
        "CrewAI é ideal para prototipagem rápida de papéis.",
        "Um ACP bem desenhado permite implementar em qualquer framework sem refazer a arquitetura.",
      ],
    },
  },
  {
    id: "9",
    slug: "gestion-ventanas-contexto-agentes-larga-duracion",
    sourceDoc: "Context_Window_Management_for_Long-Running_Agents_Strategies_and_Tradeoffs_-_MachineLearningMastery..md",
    category: "memory",
    readTime: "8 min",
    date: "2026-07-25",
    categoryLabel: {
      es: "Memoria & Contexto",
      en: "Memory & Context",
      pt: "Memória & Contexto",
    },
    title: {
      es: "Gestión de Ventanas de Contexto en Agentes de Larga Duración: Estrategias y Trade-offs",
      en: "Context Window Management for Long-Running Agents: Strategies and Tradeoffs",
      pt: "Gestão de Janelas de Contexto em Agentes de Longa Duração: Estratégias e Trade-offs",
    },
    summary: {
      es: "Estrategias avanzadas de compresión de contexto, resumen jerárquico y poda selectiva de mensajes para mantener agentes operando indefinidamente.",
      en: "Advanced context compression, hierarchical summarization, and message pruning strategies to keep agents running indefinitely.",
      pt: "Estratégias avançadas de compressão de contexto, resumo hierárquico e poda de mensagens para agentes de longa duração.",
    },
    keyTakeaways: {
      es: [
        "El fenómeno 'Lost in the Middle' afecta gravemente el razonamiento si el contexto supera los 32k tokens sin estructura.",
        "Usa buffers deslizantes y almacena el estado resumido en SQLite/Postgres.",
        "Configura umbrales de compresión deterministas antes de llamar al LLM.",
      ],
      en: [
        "'Lost in the Middle' degrades reasoning when unstructured context exceeds 32k tokens.",
        "Use sliding buffers and persist summarized state in SQLite/Postgres.",
        "Trigger deterministic compression thresholds before invoking the LLM.",
      ],
      pt: [
        "O fenômeno 'Lost in the Middle' degrada o raciocínio quando o contexto não estruturado passa de 32k tokens.",
        "Use buffers deslizantes e persista o estado resumido no banco de dados.",
        "Dispare limites determinísticos de compressão antes de chamar o LLM.",
      ],
    },
  },
  {
    id: "10",
    slug: "planificacion-jerarquica-htn-agentes-ia",
    sourceDoc: "Hierarchical_Task_Networks_for_AI_Agents_Planning_..._-_CallSphere.md",
    category: "architecture",
    readTime: "8 min",
    date: "2026-07-20",
    categoryLabel: {
      es: "Arquitectura",
      en: "Architecture",
      pt: "Arquitetura",
    },
    title: {
      es: "Planificación Jerárquica de Tareas (HTN) en Agentes de IA: Control Determinista del Razonamiento",
      en: "Hierarchical Task Networks (HTN) in AI Agents: Deterministic Reasoning Control",
      pt: "Planejamento Hierárquico de Tarefas (HTN) em Agentes de IA: Controle Determinístico de Raciocínio",
    },
    summary: {
      es: "Cómo combinar la flexibilidad generativa de los LLMs con redes de tareas jerárquicas clásicas para garantizar orden de ejecución y seguridad operacional.",
      en: "How to marry LLM generative flexibility with classical HTN trees to guarantee deterministic execution order and operational safety.",
      pt: "Como combinar a flexibilidade dos LLMs com redes de tarefas hierárquicas para garantir ordem de execução.",
    },
    keyTakeaways: {
      es: [
        "HTN descompone metas de alto nivel en métodos y operadores atómicos verificables.",
        "Permite rollback inmediato si una herramienta falla en un paso crítico.",
        "El Blueprint Pro de LAB genera la estructura HTN lista para ejecución.",
      ],
      en: [
        "HTN decomposes high-level goals into atomic verifiable methods and operators.",
        "Enables instant rollback if a tool call fails on a critical step.",
        "LAB's Blueprint Pro automatically generates HTN execution trees.",
      ],
      pt: [
        "HTN decompõe metas de alto nível em métodos e operadores atômicos verificáveis.",
        "Permite rollback imediato se uma ferramenta falhar em uma etapa crítica.",
        "O Blueprint Pro do LAB gera a estrutura HTN pronta para execução.",
      ],
    },
  },
  {
    id: "11",
    slug: "memgpt-llm-sistemas-operativos",
    sourceDoc: "MemGPT_Towards_LLMs_as_Operating_Systems_-_arXiv.md",
    category: "memory",
    readTime: "9 min",
    date: "2026-07-15",
    categoryLabel: {
      es: "Memoria & Contexto",
      en: "Memory & Context",
      pt: "Memória & Contexto",
    },
    title: {
      es: "MemGPT: Hacia LLMs como Sistemas Operativos con Memoria Virtual Jerárquica",
      en: "MemGPT: Towards LLMs as Operating Systems with Hierarchical Virtual Memory",
      pt: "MemGPT: Rumo a LLMs como Sistemas Operacionais com Memória Virtual Hierárquica",
    },
    summary: {
      es: "Análisis del paper pionero sobre gestión de memoria virtual inspirada en SO: paginación de contexto, memoria core auto-editable y almacenamiento externo.",
      en: "Analysis of the pioneering OS-inspired virtual memory paper: context paging, self-editing core memory, and archival external storage.",
      pt: "Análise do artigo pioneiro sobre gestão de memória virtual inspirada em SO: paginação de contexto e memória externa.",
    },
    keyTakeaways: {
      es: [
        "Permite a los agentes auto-modificar su perfil y recordar preferencias de largo plazo.",
        "Usa llamadas a funciones como interrupciones de sistema para mover datos entre memoria RAM (contexto) y disco.",
        "Fundamental para agentes de soporte continuo y asistentes personales corporativos.",
      ],
      en: [
        "Enables agents to self-edit their persona and recall long-term user preferences.",
        "Uses function calls as system interrupts to page data between context and disk.",
        "Crucial for persistent customer support agents and corporate executive assistants.",
      ],
      pt: [
        "Permite que agentes auto-modifiquem seu perfil e lembrem preferências de longo prazo.",
        "Usa chamadas de função como interrupções de sistema para paginar dados entre contexto e disco.",
        "Fundamental para agentes de suporte contínuo e assistentes corporativos.",
      ],
    },
  },
  {
    id: "12",
    slug: "ingenieria-sistemas-agentes-autonomos",
    sourceDoc: "Systems_Engineering_of_Autonomous_AI_Agents_Lifecycle,_Cognitive_Loops,_Memory_Architectures,_and_Mu.md",
    category: "methodology",
    readTime: "11 min",
    date: "2026-07-10",
    categoryLabel: {
      es: "Metodología",
      en: "Methodology",
      pt: "Metodologia",
    },
    title: {
      es: "Ingeniería de Sistemas de Agentes Autónomos: Ciclos Cognitivos, Seguridad y Arquitectura Multi-Nivel",
      en: "Systems Engineering of Autonomous AI Agents: Cognitive Loops, Safety & Multi-Tier Architecture",
      pt: "Engenharia de Sistemas de Agentes Autônomos: Ciclos Cognitivos, Segurança e Arquitetura Multi-Nível",
    },
    summary: {
      es: "Tratado integral de ingeniería de sistemas aplicada a IA agéntica: control de lazo cerrado, desacoplamiento de capas y confiabilidad en producción.",
      en: "Comprehensive systems engineering treatise for agentic AI: closed-loop control, layer decoupling, and enterprise production reliability.",
      pt: "Tratado abrangente de engenharia de sistemas aplicada a IA agêntica: controle de loop fechado e confiabilidade em produção.",
    },
    keyTakeaways: {
      es: [
        "Aplica principios de ingeniería de control al ciclo Percepción-Razonamiento-Acción.",
        "Establece límites deterministas alrededor de modelos estocásticos.",
        "LAB consolida esta disciplina en planos ejecutables (Blueprints) y paquetes ACP.",
      ],
      en: [
        "Applies control engineering principles to the Perception-Reasoning-Action loop.",
        "Enforces deterministic boundaries around stochastic LLM models.",
        "LAB consolidates this discipline into executable Blueprints and ACP packages.",
      ],
      pt: [
        "Aplica princípios de engenharia de controle ao ciclo Percepção-Raciocínio-Ação.",
        "Estabelece limites determinísticos ao redor de modelos estocásticos.",
        "O LAB consolida essa disciplina em plantas executáveis (Blueprints) e pacotes ACP.",
      ],
    },
  },
];
