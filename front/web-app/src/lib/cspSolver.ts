// ==============================================
// CSP Solver (Constraint Satisfaction Problem)
// ==============================================
// Resolve o problema de satisfação de restrições para selecionar
// os fornecedores mais compatíveis com base no pedido.
// ----------------------------------------------
// Variáveis: categoria, urgência, orçamento
// Domínios: valores possíveis dessas variáveis
// Restrições: regras que determinam a compatibilidade
// ==============================================

export type CategoriaManutencao =
    | "eletricista"
    | "canalizador"
    | "limpeza"
    | "pintura"
    | "jardinagem"
    | "outro";

export type UrgenciaNivel = "baixa" | "media" | "alta" | null;

export type ServicoFornecedor = {
    tipo_servico: CategoriaManutencao;
    preco_medio?: number | null;
};

export type FornecedorCSP = {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    avaliacao_media?: number | null;
    disponibilidade?: boolean | null;
    servicos: ServicoFornecedor[];
};

export type PedidoCSP = {
    categoria: CategoriaManutencao | null;
    urgencia: UrgenciaNivel;
    orcamento_max?: number | null;
};

/**
 * Resolve o CSP de seleção de fornecedor.
 * Retorna fornecedores válidos com um "score" de compatibilidade (0–1).
 */
export function resolverCSP(
    pedido: PedidoCSP,
    fornecedores: FornecedorCSP[]
): { fornecedor: FornecedorCSP; score: number }[] {
    if (!fornecedores || fornecedores.length === 0) return [];
    if (!pedido.categoria) return [];

    // ⚙️ 1. Filtra apenas fornecedores que oferecem o tipo de serviço
    const fornecedoresValidos = fornecedores.filter((f) =>
        f.servicos.some(
            (s) => s.tipo_servico.toLowerCase() === pedido.categoria!.toLowerCase()
        )
    );

    if (fornecedoresValidos.length === 0) return [];

    // ⚖️ 2. Avalia cada fornecedor com base nas restrições
    const results = fornecedoresValidos.map((f) => {
        let score = 0;

        // ---- 1️⃣ Categoria (peso 0.4) ----
        // Já filtramos, mas podemos reforçar o peso se ele oferece múltiplos serviços
        const matchCount = f.servicos.filter(
            (s) => s.tipo_servico.toLowerCase() === pedido.categoria!.toLowerCase()
        ).length;
        score += 0.4 * Math.min(1, matchCount); // 0.4 pontos totais

        // ---- 2️⃣ Disponibilidade (peso 0.2) ----
        if (f.disponibilidade) score += 0.2;
        else score -= 0.05; // pequena penalização se indisponível

        // ---- 3️⃣ Avaliação média (peso 0.2) ----
        const rating = f.avaliacao_media ?? 0;
        if (rating >= 4.8) score += 0.2;
        else if (rating >= 4.5) score += 0.18;
        else if (rating >= 4.0) score += 0.14;
        else if (rating >= 3.5) score += 0.1;
        else if (rating >= 3.0) score += 0.05;
        else score -= 0.05; // penaliza avaliações ruins

        // ---- 4️⃣ Orçamento (peso 0.1) ----
        const precoServico =
            f.servicos.find(
                (s) =>
                    s.tipo_servico.toLowerCase() === pedido.categoria!.toLowerCase()
            )?.preco_medio ?? null;

        if (pedido.orcamento_max && precoServico) {
            const diff = precoServico - pedido.orcamento_max;

            if (diff <= 0) {
                // Está dentro do orçamento
                score += 0.1;
            } else if (diff <= 50) {
                // Levemente acima (aceitável)
                score += 0.05;
            } else {
                // Muito acima
                score -= 0.1;
            }
        }

        // ---- 5️⃣ Urgência (peso 0.1) ----
        if (pedido.urgencia) {
            const urg = pedido.urgencia.toLowerCase();
            if (urg === "alta") score += f.disponibilidade ? 0.1 : 0.02;
            else if (urg === "media") score += f.disponibilidade ? 0.05 : 0.02;
            else score += 0.02; // baixa urgência, pouca influência
        }

        // 🔒 Normaliza score entre 0 e 1
        score = Math.max(0, Math.min(1, score));

        return { fornecedor: f, score };
    });

    // 🔝 Ordena pelo score decrescente
    return results.sort((a, b) => b.score - a.score);
}