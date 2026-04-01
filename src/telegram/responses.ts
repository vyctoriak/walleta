/**
 * Walleta — Templates de resposta com personalidade
 *
 * Tom de voz: amigável, leve, descontraída, sem julgamentos,
 * levemente sarcástica (com cuidado), incentivadora, uso moderado de emojis.
 *
 * @see BRANDING.md
 */

export type ResponseCategory =
  | 'welcome'
  | 'transaction_created'
  | 'high_spending'
  | 'report'
  | 'encouragement'
  | 'unknown';

const responses: Record<ResponseCategory, string[]> = {
  welcome: [
    'Oi! Eu sou a Walleta 💜 bora organizar essa vida financeira?',
    'E aí! Chega mais que a Walleta tá pronta pra te ajudar 💜',
    'Bem-vindo(a)! Prometo não julgar… só talvez dar uns puxões de orelha 😅',
    'Oii! Vim te ajudar a gastar melhor — não necessariamente menos 👀',
    'Salve! Sou sua nova melhor amiga financeira 💜 bora começar?',
  ],

  transaction_created: [
    'Anotado! Seu eu do futuro agradece 🙏',
    'Ok, registrado! Mas vamos fingir que foi necessário né? 😅',
    'Prontinho! Tá tudo anotadinho aqui comigo 📝',
    'Registrado com sucesso! Olha você sendo organizad@ ✨',
    'Feito! Eu guardo os números, você guarda a calma 💜',
  ],

  high_spending: [
    'Amiga… calma 😳 seu saldo tá ficando tímido',
    'Respira… esse gasto era *necessário* ou foi emoção? 👀',
    'Se continuar assim, vamos ter que conversar sério 😅',
    'Eita… seus gastos tão *animados* esse mês, hein? 💸',
    'Opa, alerta Walleta! 🚨 Bora dar uma respirada nos gastos?',
  ],

  report: [
    'Resumo da fofoca financeira do mês 👇',
    'Seu dinheiro andou fazendo umas coisas… vem ver 👀',
    'Hora da verdade! Aqui vai seu relatório 📊',
    'Preparei um resuminho pra você. Sem spoilers… ou quase 😅',
    'Bora dar uma olhada em como seu dinheiro se comportou? 📈',
  ],

  encouragement: [
    'AAAAA perfeita 😍 isso sim é autocontrole!',
    'Orgulho define 💜 seu dinheiro tá seguro comigo',
    'Olha ela sendo responsável 👏✨',
    'Isso aí! Continua assim que o sucesso financeiro vem 🚀',
    'Tô orgulhosa de você! Cada passo conta 💜',
  ],

  unknown: [
    'Hmm, não entendi muito bem 🤔 tenta de novo?',
    'Essa eu não peguei 😅 pode reformular?',
    'Opa, não entendi! Mas tô aqui pra te ajudar 💜',
    'Não consegui entender, mas sem estresse! Tenta de novo? 😊',
    'Vixi, essa me pegou 😅 pode tentar de outro jeito?',
  ],
};

/**
 * Retorna uma resposta aleatória da categoria especificada.
 *
 * @param category - Categoria do template de resposta
 * @returns Uma string aleatória da categoria
 *
 * @example
 * ```ts
 * const msg = getRandomResponse('welcome');
 * // "Oi! Eu sou a Walleta 💜 bora organizar essa vida financeira?"
 * ```
 */
export function getRandomResponse(category: ResponseCategory): string {
  const pool = responses[category];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Retorna todas as respostas de uma categoria (útil para testes).
 */
export function getAllResponses(category: ResponseCategory): string[] {
  return [...responses[category]];
}
