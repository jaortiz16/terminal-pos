export type CardBrand = 'VISA' | 'MAST' | 'AMEX' | 'DISC' | 'unknown';


export function detectCardBrand(cardNumber: string): CardBrand {
  const num = cardNumber.replace(/\D/g, '');
  
  if (num.startsWith('4')) {
    return 'VISA';
  } else if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) {
    return 'MAST';
  } else if (/^3[47]/.test(num)) {
    return 'AMEX';
  } else if (/^6(?:011|5)/.test(num)) {
    return 'DISC';
  }
  
  return 'unknown';
}


export function formatCardNumber(cardNumber: string): string {
  const num = cardNumber.replace(/\D/g, '');
  const brand = detectCardBrand(num);
  
  if (brand === 'AMEX') {
    return num.replace(/(\d{4})(\d{6})(\d{0,5})/, '$1 $2 $3').trim();
  } else {
    return num.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }
}

export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 2) {
    return cleaned;
  } else {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
}

export type TransactionType = 'PAG' | 'DEV' | 'ANU';
export type TransactionMode = 'SIM' | 'DIF' | 'REC';
export type Currency = 'USD' | 'EUR' | 'MXN';

export interface Transaction {
  tipo: TransactionType;
  marca: CardBrand;
  modalidad: TransactionMode;
  monto: number;
  moneda: Currency;
  numeroTarjeta: string;
  nombreTitular: string;
  plazo?: number;
  recurrente?: boolean;
  frecuenciaDias?: number;
  cvv?: string;
  fechaExpiracion?: string;
} 