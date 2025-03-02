import { create } from 'zustand';
import axios from 'axios';
import { CardBrand, Transaction, TransactionMode, TransactionType, Currency } from '@/utils/helpers';

interface TransactionState {
  // Campos de la transacción
  tipo: TransactionType;
  marca: CardBrand;
  modalidad: TransactionMode;
  monto: number;
  moneda: Currency;
  numeroTarjeta: string;
  nombreTitular: string;
  plazo: number | undefined;
  recurrente: boolean;
  frecuenciaDias: number | undefined;
  
  // Estados de la interfaz
  isLoading: boolean;
  error: string | null;
  success: boolean;
  
  // Acciones
  setField: <K extends keyof Transaction>(field: K, value: Transaction[K]) => void;
  resetForm: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  
  // Para procesamiento de transacción
  processTransaction: () => Promise<void>;
}

const initialState: Omit<TransactionState, 'setField' | 'resetForm' | 'setLoading' | 'setError' | 'setSuccess' | 'processTransaction'> = {
  tipo: 'PAG',
  marca: 'unknown',
  modalidad: 'SIM',
  monto: 0,
  moneda: 'USD',
  numeroTarjeta: '',
  nombreTitular: '',
  plazo: undefined,
  recurrente: false,
  frecuenciaDias: undefined,
  isLoading: false,
  error: null,
  success: false
};

// URL base de la API de Spring
const API_URL = 'http://localhost:8080/v1/transacciones';

export const useTransactionStore = create<TransactionState>((set, get) => ({
  ...initialState,
  
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  
  resetForm: () => set({ 
    tipo: initialState.tipo,
    marca: initialState.marca,
    modalidad: initialState.modalidad,
    monto: initialState.monto,
    moneda: initialState.moneda,
    numeroTarjeta: initialState.numeroTarjeta,
    nombreTitular: initialState.nombreTitular,
    plazo: initialState.plazo,
    recurrente: initialState.recurrente,
    frecuenciaDias: initialState.frecuenciaDias,
    isLoading: initialState.isLoading,
    error: initialState.error,
    success: initialState.success
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setSuccess: (success) => set({ success }),
  
  processTransaction: async () => {
    const state = get();
    
    try {
      set({ isLoading: true, error: null, success: false });
      
      let backendModalidad = 'SIM';
      if (state.modalidad === 'REC') {
        backendModalidad = 'REC';
      } else {
        backendModalidad = 'SIM';
      }
      
      const transactionData: any = {
        tipo: 'PAG',
        marca: state.marca === 'unknown' ? 'VISA' : state.marca,
        modalidad: backendModalidad,
        monto: state.monto,
        moneda: state.moneda,
        numeroTarjeta: state.numeroTarjeta.replace(/\D/g, ''),
        nombreTitular: state.nombreTitular
      };
      
      if (state.modalidad === 'DIF' && state.plazo) {
        transactionData.plazo = state.plazo;
      }
      
      if (state.modalidad === 'REC') {
        transactionData.recurrente = true;
        transactionData.frecuenciaDias = state.frecuenciaDias || 30;
      }
      
      console.log('Enviando datos de transacción:', transactionData);
      
      const response = await axios.post(API_URL, transactionData);
      
      console.log('Respuesta exitosa:', response);
      
      set({ success: true, isLoading: false });
      
      setTimeout(() => {
        set({ success: false });
        get().resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('Error al procesar la transacción:', error);
      
      let errorMessage = 'Error desconocido al procesar la transacción';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          errorMessage = 'No se pudo conectar con el servidor. Verifique que el servicio esté en ejecución.';
        } else if (error.response) {
          if (error.response.status === 400) {
            if (error.response.data && typeof error.response.data === 'string' && error.response.data.includes('Validation failed')) {
              errorMessage = 'Datos inválidos: verifique número de tarjeta (16 dígitos) y datos del titular';
            } else {
              errorMessage = 'Datos inválidos para la transacción';
            }
          } else if (error.response.status === 404) {
            errorMessage = 'Terminal POS no encontrado';
          } else if (error.response.status === 500) {
            errorMessage = 'Error de comunicación con el Payment Gateway';
          }
          
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.log('Estableciendo error:', errorMessage);
      
      set({ error: errorMessage, isLoading: false, success: false });
      
      setTimeout(() => {
        set({ error: null });
        get().resetForm();
      }, 5000);
    }
  }
})); 