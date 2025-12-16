/* =========================================================
   Tipos base
========================================================= */

export type PedidoCSP = {
  categoria: string | null;
  orcamento_max: number | null;
  data: string | null;       // YYYY-MM-DD
  hora: string | null;       // HH:mm
  duracao_minutos: number;   // ex: 60
};

export type Slot = {
  inicio: string; // ISO timestamp
  fim: string;    // ISO timestamp
};

export type ServicoFornecedor = {
  tipo_servico: string;
  preco_medio?: number | null;
};

export type Fornecedor = {
  id: string;
  nome: string;
  disponibilidade?: boolean | null;
  avaliacao_media?: number | null;
  servicos?: ServicoFornecedor[];
  slots?: Slot[];
};

/* =========================================================
   Utilidades de data/hora
========================================================= */

// Converte data + hora para Date
function buildDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

// Soma minutos a uma data
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/* =========================================================
   Função principal do CSP
========================================================= */

export function resolverCSP(
  pedido: PedidoCSP,
  fornecedores: Fornecedor[]
) {
  const solucoes: {
    fornecedor: Fornecedor;
    slot: Slot;
    score: number;
  }[] = [];

  /* =======================================================
     Pré-validações
  ======================================================= */

  if (
    !pedido.categoria ||
    !pedido.data ||
    !pedido.hora ||
    !pedido.duracao_minutos
  ) {
    return [];
  }

  const pedidoInicio = buildDateTime(pedido.data, pedido.hora);
  const pedidoFim = addMinutes(pedidoInicio, pedido.duracao_minutos);

  /* =======================================================
     BACKTRACKING (3 variáveis)
     Variável 1: Fornecedor
     Variável 2: Serviço
     Variável 3: Slot
  ======================================================= */

  function backtrack(
    fornecedorIdx: number
  ) {
    if (fornecedorIdx >= fornecedores.length) return;

    const fornecedor = fornecedores[fornecedorIdx];

    /* ---------- Restrição 1: fornecedor disponível ---------- */
    if (!fornecedor.disponibilidade) {
      backtrack(fornecedorIdx + 1);
      return;
    }

    /* ---------- Variável 2: serviços ---------- */
    const servicos = fornecedor.servicos ?? [];

    for (const servico of servicos) {
      /* ---------- Restrição 2: categoria ---------- */
      if (servico.tipo_servico !== pedido.categoria) continue;

      /* ---------- Restrição 3: orçamento ---------- */
      if (
        pedido.orcamento_max != null &&
        servico.preco_medio != null &&
        servico.preco_medio > pedido.orcamento_max
      ) {
        continue;
      }

      /* ---------- Variável 3: slots ---------- */
      const slots = fornecedor.slots ?? [];

      for (const slot of slots) {
        const slotInicio = new Date(slot.inicio);
        const slotFim = new Date(slot.fim);

        /* ===================================================
           🔑 REGRA CORRIGIDA – INTERSEÇÃO DE HORÁRIO
           
           Um slot é válido se INTERSECTAR o pedido:
           
           slot.inicio < pedidoFim
           slot.fim    > pedidoInicio
        =================================================== */

        const intersecta =
          slotInicio < pedidoFim &&
          slotFim > pedidoInicio;

        if (!intersecta) continue;

        /* ---------- Score (heurística simples) ---------- */
        const score =
          (fornecedor.avaliacao_media ?? 0) / 5;

        solucoes.push({
          fornecedor,
          slot,
          score,
        });
      }
    }

    backtrack(fornecedorIdx + 1);
  }

  backtrack(0);

  /* =======================================================
     Ordenação final (melhor score primeiro)
  ======================================================= */

  return solucoes.sort((a, b) => b.score - a.score);
}
