const DEFAULT_API_URL = 'https://api.languagetool.org/v2/check';
const DEFAULT_LANGUAGE = 'pt-BR';

export type CorrectionReplacement = {
  value: string;
};

export type CorrectionMatch = {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements: CorrectionReplacement[];
  context?: {
    text: string;
    offset: number;
    length: number;
  };
  rule?: {
    id?: string;
    description?: string;
    issueType?: string;
  };
};

export type CorrectionResult = {
  matches: CorrectionMatch[];
};

class TextCorrectionError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

const apiUrl =
  (import.meta.env.VITE_TEXT_CORRECTOR_API_URL as string | undefined)?.trim() ||
  DEFAULT_API_URL;

export async function checkPortugueseText(text: string): Promise<CorrectionResult> {
  if (typeof fetch === 'undefined') {
    throw new TextCorrectionError('API de correção indisponível no ambiente atual.');
  }

  const body = new URLSearchParams({
    text,
    language: DEFAULT_LANGUAGE,
    enabledOnly: 'false',
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const message =
      response.status === 429
        ? 'Limite de uso do corretor atingido. Tente novamente em instantes.'
        : `Erro ao acessar o corretor (${response.status}).`;
    throw new TextCorrectionError(message, response.status);
  }

  const data = (await response.json()) as CorrectionResult;
  return {
    matches: Array.isArray(data.matches) ? data.matches : [],
  };
}

export { TextCorrectionError };
