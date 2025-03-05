import { create } from 'zustand';
import axios from 'axios';
import { CardBrand, Transaction, TransactionMode, TransactionType, Currency } from '@/utils/helpers';

interface TransactionState {
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
  cvv: string;
  fechaExpiracion: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  
  setField: <K extends keyof Transaction>(field: K, value: Transaction[K]) => void;
  resetForm: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
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
  plazo: 3,
  recurrente: false,
  frecuenciaDias: 30,
  cvv: '',
  fechaExpiracion: '',
  isLoading: false,
  error: null,
  success: false
};
const API_URL = 'http://pos-alb-1760670904.us-east-2.elb.amazonaws.com/api/v1/transacciones';

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
    cvv: initialState.cvv,
    fechaExpiracion: initialState.fechaExpiracion,
    isLoading: initialState.isLoading,
    error: initialState.error,
    success: initialState.success
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setSuccess: (success) => set({ success }),
  
  processTransaction: async () => {
    try {
      const state = get();
      set({ isLoading: true, error: null, success: false });
      
      // Detectar la modalidad basada en las selecciones del usuario
      let backendModalidad;
      if (state.modalidad === 'REC') {
        backendModalidad = 'REC';
      } else if (state.modalidad === 'DIF') {
        // Para transacciones diferidas, usamos "DIF" para el backend
        backendModalidad = 'DIF';
      } else {
        backendModalidad = 'SIM';
      }
      
      // Datos básicos de la transacción
      const transactionData: any = {
        tipo: 'PAG',
        marca: state.marca === 'unknown' ? 'VISA' : state.marca,
        modalidad: backendModalidad,
        monto: state.monto,
        moneda: state.moneda,
        numeroTarjeta: state.numeroTarjeta.replace(/\D/g, ''),
        nombreTitular: state.nombreTitular,
        // Asegurar que el CVV tenga 3 dígitos
        cvv: state.cvv && state.cvv.length >= 3 ? state.cvv : state.cvv.padStart(3, '0'),
        fechaExpiracion: state.fechaExpiracion,
        // Agregar detalle para la referencia
        detalle: 'Compra realizada desde Terminal POS',
      };
      
      // Configurar campos específicos según la modalidad frontend
      if (state.modalidad === 'DIF') {
        // Para pagos diferidos - asegurar que siempre tenga un plazo válido
        transactionData.plazo = state.plazo || 3; // Usar valor por defecto si no está definido
        console.log('Transacción diferida con plazo:', transactionData.plazo);
      } else if (backendModalidad === 'REC') {
        // Para pagos recurrentes
        transactionData.recurrente = true;
        transactionData.frecuenciaDias = state.frecuenciaDias || 30;
      } else {
        // Para pagos simples
        transactionData.recurrente = false;
      }
      
      console.log('Enviando datos de transacción:', transactionData);
      
      const response = await axios.post(API_URL, transactionData);
      
      console.log('Respuesta exitosa:', response);
      
      // Si llegamos aquí, la transacción fue aprobada (código 200)
      set({ 
        success: true, 
        isLoading: false,
        error: null
      });
      
      setTimeout(() => {
        set({ success: false });
        get().resetForm();
      }, 2000);
    } catch (error) {
      console.error('Error al procesar la transacción:', error);
      
      // Simplificar el mensaje de error para la interfaz de usuario
      set({ 
        error: "Pago rechazado", 
        isLoading: false,
        success: false
      });
      
      // Limpiar el error y resetear el formulario después de un tiempo
      setTimeout(() => {
        set({ error: null });
        get().resetForm();
      }, 3000);
    }
  }
})); 