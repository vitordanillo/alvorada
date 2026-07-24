/**
 * Utilitário para validação, formatação e consulta de CNPJ via BrasilAPI.
 */

/**
 * Remove caracteres não numéricos do CNPJ.
 */
export function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

/**
 * Aplica máscara de CNPJ: XX.XXX.XXX/XXXX-XX
 */
export function formatCnpj(cnpj: string): string {
  const digits = cleanCnpj(cnpj);
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Aplica máscara de CPF: XXX.XXX.XXX-XX
 */
export function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Aplica máscara de CPF ou CNPJ dependendo do tamanho.
 */
export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) return formatCpf(digits);
  return formatCnpj(digits);
}

/**
 * Aplica máscara dinâmica enquanto o usuário digita (CPF ou CNPJ).
 */
export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    // CPF mask
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  // CNPJ mask
  return digits
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara dinâmica de CNPJ enquanto o usuário digita.
 */
export function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Valida CNPJ com dígitos verificadores.
 */
export function isValidCnpj(cnpj: string): boolean {
  const digits = cleanCnpj(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calc = (base: number): number => {
    let sum = 0;
    let weight = base === 12 ? 5 : 6;
    for (let i = 0; i < base; i++) {
      sum += parseInt(digits[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calc(12) === parseInt(digits[12]) && calc(13) === parseInt(digits[13]);
}

/**
 * Valida CPF com dígitos verificadores.
 */
export function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (base: number): number => {
    let sum = 0;
    for (let i = 0; i < base; i++) {
      sum += parseInt(digits[i]) * (base + 1 - i);
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calc(9) === parseInt(digits[9]) && calc(10) === parseInt(digits[10]);
}

/**
 * Tipo de retorno da consulta de CNPJ.
 */
export type CnpjLookupResult = {
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  situacao: string;
};

/**
 * Consulta CNPJ na BrasilAPI via nossa API route proxy.
 */
export async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  const digits = cleanCnpj(cnpj);
  if (digits.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos.');
  }

  const response = await fetch(`/api/cnpj/${digits}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('CNPJ não encontrado na base da Receita Federal.');
    }
    throw new Error('Erro ao consultar CNPJ. Tente novamente.');
  }

  return response.json();
}

/**
 * Aplica máscara de telefone brasileiro.
 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/**
 * Aplica máscara de CEP: XXXXX-XXX
 */
export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}
