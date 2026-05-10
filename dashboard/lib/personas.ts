import type { Persona } from "./types";

// ============================================================
// 6 Customer Personas — diseñadas a partir de los datos
// que Gohan AI captura en las 3 capas del onboarding y uso real.
// Cada persona tiene un play de monetización claro.
// ============================================================

export const PERSONAS: Persona[] = [
  {
    id: "newcomer",
    name: "El Recién Llegado",
    tagline: "Acaba de inscribirse, todo es nuevo y abrumador",
    description:
      "Persona que se inscribió hace menos de 90 días. Suele ser principiante absoluto, motivado pero frágil. El 60% del churn del gym ocurre acá. Gohan le entregó la primera rutina en menos de 2 minutos y ahora hay que retenerlo.",
    ageRange: "22-38 años",
    pctOfBase: 24,
    primaryGoals: ["salud-general", "perder-grasa"],
    keyData: [
      "Onboarding completado (Capa 1) pero Capa 2 incompleta",
      "Adherencia <50% en semanas 3-6 (señal de fuga)",
      "Pocas modificaciones de rutina = no entiende cómo personalizarla",
      "NPS aún no medido o primer NPS bajo",
    ],
    monetization: {
      headline:
        "Vender un onboarding premium con coach humano + plan de 90 días con garantía de progreso",
      products: [
        { name: "Pack onboarding 90 días con coach", priceUsd: 89, conversion: 18 },
        { name: "Sesión de antropometría inicial", priceUsd: 25, conversion: 42 },
        { name: "Plan nutricional starter", priceUsd: 35, conversion: 22 },
      ],
      estArpuLiftUsd: 18,
    },
    retentionPlay:
      "Trigger de Gohan en día 14, 30, 60: NPS + check-in proactivo. Si adherencia <40%, ofrecer cambio de plan o sesión 1:1 gratis.",
    color: "amber",
  },
  {
    id: "hipertrofia",
    name: "El Hipertrofia-Driven",
    tagline: "Vino por músculo, mide cada serie y cada gramo",
    description:
      "Hombre o mujer 20-30 años, intermedio o avanzado, entrena 4-6 días, mide pesos y reps al detalle. Es el usuario que más datos genera y el más receptivo a productos de performance. Wearable activo, busca PRs.",
    ageRange: "20-32 años",
    pctOfBase: 22,
    primaryGoals: ["hipertrofia", "fuerza"],
    keyData: [
      "Volumen total semanal (sets x reps x peso) — top 25%",
      "PR tracking automático en compuestos (sentadilla, banca, peso muerto)",
      "Suplementación declarada en chat con Gohan",
      "Edita rutina 5+ veces por mes (alta involvement)",
    ],
    monetization: {
      headline:
        "Marketplace integrado de suplementos + planes de nutrición pro + asesorías premium",
      products: [
        { name: "Proteína whey (recurrente mensual)", priceUsd: 45, conversion: 38 },
        { name: "Creatina + pre-entreno bundle", priceUsd: 55, conversion: 28 },
        { name: "Plan de macros personalizado", priceUsd: 39, conversion: 31 },
        { name: "Asesoría 1:1 con coach pro", priceUsd: 80, conversion: 15 },
      ],
      estArpuLiftUsd: 42,
    },
    retentionPlay:
      "Gamificación de PRs + ranking interno. Notificación cuando se acerca a un PR para empujar la sesión.",
    color: "rose",
  },
  {
    id: "professional",
    name: "El Profesional Ocupado",
    tagline: "Tiempo escaso, ingresos altos, paga por que le resuelvan",
    description:
      "30-45 años, ejecutivo o emprendedor, 3-4 días/semana en el mejor de los casos. Estrés alto, sueño irregular. Es el cliente más rentable: paga premium con tal de que el sistema le quite fricción.",
    ageRange: "30-45 años",
    pctOfBase: 18,
    primaryGoals: ["salud-general", "perder-grasa"],
    keyData: [
      "Estrés autoreportado 4-5/5",
      "Sueño promedio <6.5h, calidad baja (vía wearable)",
      "Sesiones de 30-45 min preferidas",
      "Disposición a pagar 2-3x por planes anuales",
    ],
    monetization: {
      headline:
        "Plan anual premium con concierge digital + recovery (sueño, mindfulness, fisio)",
      products: [
        { name: "Plan anual Elite (pago único)", priceUsd: 1290, conversion: 22 },
        { name: "Sesión de fisio/recovery semanal", priceUsd: 60, conversion: 19 },
        { name: "Programa de sueño + mindfulness", priceUsd: 29, conversion: 35 },
        { name: "Express workout pack (30 min)", priceUsd: 0, conversion: 0 },
      ],
      estArpuLiftUsd: 65,
    },
    retentionPlay:
      "Si el wearable detecta 3 noches seguidas <6h sueño, Gohan sugiere sesión light + meditación. Comunicación por WhatsApp, no por app.",
    color: "indigo",
  },
  {
    id: "holistic-female",
    name: "La Mujer Saludable Integral",
    tagline: "Quiere entrenar en sintonía con su ciclo y su salud completa",
    description:
      "Mujeres 25-45 años que activan el módulo de salud reproductiva. Buscan un enfoque integral: entrenar respetando fases del ciclo, nutrición específica, hormonas. Generan datos únicos que ningún otro segmento da.",
    ageRange: "25-45 años",
    pctOfBase: 16,
    primaryGoals: ["hipertrofia", "salud-general", "perder-grasa"],
    keyData: [
      "Fase del ciclo declarada/inferida (folicular/ovulatoria/lútea/menstrual)",
      "Síntomas premenstruales reportados al chat",
      "Ajustes de intensidad por fase (oro para investigación)",
      "Mayor uso del módulo nutricional",
    ],
    monetization: {
      headline:
        "Partnership con marcas femme + plan de nutrición ciclo-sincronizada + comunidad",
      products: [
        { name: "Plan de nutrición ciclo-sincronizada", priceUsd: 49, conversion: 34 },
        { name: "Tracking hormonal premium", priceUsd: 19, conversion: 41 },
        { name: "Bundle skincare + suplementos femme (afiliado)", priceUsd: 75, conversion: 24 },
        { name: "Membresía a comunidad femme", priceUsd: 12, conversion: 52 },
      ],
      estArpuLiftUsd: 38,
    },
    retentionPlay:
      "Adaptar rutina automáticamente en fase lútea (volumen -15%, foco en estabilidad). Newsletter mensual con investigación.",
    color: "fuchsia",
  },
  {
    id: "active-senior",
    name: "El Senior Activo",
    tagline: "Movilidad, prevención y vida larga — pagaría más por seguridad",
    description:
      "50+ años, objetivo: salud, prevención de caídas, manejo de condiciones crónicas. Es el segmento con mayor LTV (permanecen 4-7 años) y el menos atendido por la app actual del gym. Gohan puede capturar medicación, antecedentes y condiciones.",
    ageRange: "50-72 años",
    pctOfBase: 11,
    primaryGoals: ["salud-general", "fuerza"],
    keyData: [
      "Medicación declarada (anticoagulantes, antihipertensivos, etc.)",
      "Condiciones crónicas: hipertensión, artrosis, osteoporosis",
      "FC en reposo + variabilidad (vía wearable médico)",
      "Lesiones recurrentes — historial de fisio",
    ],
    monetization: {
      headline:
        "Convenios B2B con obras sociales/seguros + paquete fisio + nutrición geriátrica",
      products: [
        { name: "Plan reembolsable por obra social", priceUsd: 0, conversion: 28 },
        { name: "Bundle fisio + entrenamiento", priceUsd: 95, conversion: 33 },
        { name: "Suplementación específica (Ca, Vit D, colágeno)", priceUsd: 32, conversion: 47 },
        { name: "Evaluación funcional trimestral", priceUsd: 45, conversion: 51 },
      ],
      estArpuLiftUsd: 28,
    },
    retentionPlay:
      "Reporte mensual al médico de cabecera (con consentimiento). Genera lock-in muy fuerte.",
    color: "emerald",
  },
  {
    id: "performance-athlete",
    name: "El Atleta Amateur",
    tagline: "Compite los fines de semana, optimiza cada dato del wearable",
    description:
      "Cualquier edad, entrena 5-6 días, tiene wearable de gama alta (Garmin, Whoop, Polar). Es el que mejor utiliza la integración de wearables. Lesiones recurrentes por sobreuso, busca optimización marginal.",
    ageRange: "25-50 años",
    pctOfBase: 9,
    primaryGoals: ["resistencia", "fuerza", "hipertrofia"],
    keyData: [
      "VO2max + HRV + cargas de entrenamiento (TSS)",
      "Wearable conectado >95% del tiempo",
      "Eventos de carrera/competición declarados",
      "Mayor frecuencia de lesiones por sobreuso",
    ],
    monetization: {
      headline:
        "Tier 'Elite' con coach humano + analítica avanzada + eventos + equipamiento partner",
      products: [
        { name: "Plan Elite (coach + analítica)", priceUsd: 149, conversion: 17 },
        { name: "Programa específico evento (10K, half, full)", priceUsd: 89, conversion: 24 },
        { name: "Marketplace de zapatillas/equipamiento (afiliado)", priceUsd: 0, conversion: 31 },
        { name: "Camp / retiro de entrenamiento", priceUsd: 450, conversion: 8 },
      ],
      estArpuLiftUsd: 78,
    },
    retentionPlay:
      "Alertas de overtraining cuando HRV cae 2 desv. Sugerencia automática de deload week. Reportes de carga.",
    color: "cyan",
  },
];

export function getPersonaById(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}
