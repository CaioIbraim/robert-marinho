export interface ServiceInfo {
  id: string;
  title: string;
  shortDesc: string;
  description: string;
  image: string;
  features: string[];
  specs: { label: string; value: string }[];
}

export const services: Record<string, ServiceInfo> = {
  "transporte-executivo": {
    id: "transporte-executivo",
    title: "Transporte Executivo",
    shortDesc: "Conforto, segurança e pontualidade para seus deslocamentos corporativos.",
    description: "Nossa frota de luxo e motoristas bilíngues garantem que você chegue ao seu destino com o máximo de conforto e discrição. Ideal para traslados de aeroporto, reuniões e eventos corporativos.",
    image: "/frota/1.jpg",
    features: [
      "Motoristas profissionais e treinados",
      "Frota premium com manutenção rigorosa",
      "Rastreamento em tempo real",
      "Atendimento personalizado 24/7"
    ],
    specs: [
      { label: "Veículos", value: "Sedans Premium / SUVs" },
      { label: "Seguro", value: "Cobertura total inclusa" },
      { label: "Disponibilidade", value: "Imediata ou agendada" },
      { label: "Região", value: "Nacional" }
    ]
  },
  "logistica-expressa": {
    id: "logistica-expressa",
    title: "Logística Expressa",
    shortDesc: "Agilidade máxima para encomendas críticas e prazos apertados.",
    description: "Soluções de transporte rápido para documentos e mercadorias que não podem esperar. Com nossa malha logística otimizada, garantimos entregas no menor tempo possível.",
    image: "/frota/2.jpg",
    features: [
      "Coleta em até 60 minutos",
      "Entrega porta a porta",
      "Protocolo digital de recebimento",
      "Suporte exclusivo"
    ],
    specs: [
      { label: "Prazo", value: "D+0 ou D+1" },
      { label: "Peso", value: "Até 500kg por veículo" },
      { label: "Monitoramento", value: "Full-time" },
      { label: "Garantia", value: "Entrega no prazo ou estorno" }
    ]
  },
  "gestao-de-frotas": {
    id: "gestao-de-frotas",
    title: "Gestão de Frotas",
    shortDesc: "Otimize seus custos e aumente a produtividade da sua operação.",
    description: "Terceirize o gerenciamento dos seus veículos e foque no seu core business. Utilizamos tecnologia de ponta para reduzir desperdícios e garantir a disponibilidade total da sua frota.",
    image: "/frota/3.jpg",
    features: [
      "Manutenção preventiva e corretiva",
      "Gestão de combustíveis e multas",
      "Relatórios de telemetria avançados",
      "Substituição imediata de veículos"
    ],
    specs: [
      { label: "Tecnologia", value: "IA e IoT integrada" },
      { label: "Redução de Custos", value: "Até 25%" },
      { label: "Monitoramento", value: "Dashboard real-time" },
      { label: "Contrato", value: "SLA garantido em contrato" }
    ]
  }
};
