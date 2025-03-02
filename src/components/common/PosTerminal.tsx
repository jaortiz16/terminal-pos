"use client";

import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { CardForm } from './CardForm';
import { useTransactionStore } from '@/store/useTransactionStore';
import { ThemeToggle } from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, DollarSign, AlertTriangle, Settings, Check, Loader2, X, Wifi } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "../ui/dialog";
import axios from 'axios';

interface ConfiguracionPOS {
  modelo: string;
  codigoPOS: string;
  direccionMAC: string;
  codigoComercio: string;
  fechaActivacion: string;
}

export const PosTerminal = () => {
  const [amount, setAmount] = useState('');
  const store = useTransactionStore();
  const [error, setError] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  
  // Datos de configuración del terminal (simulados)
  const [configData, setConfigData] = useState<ConfiguracionPOS>({
    modelo: "POS-2024",
    codigoPOS: "TRM-00123",
    direccionMAC: "00:1A:2B:3C:4D:5E",
    codigoComercio: "COM-4567",
    fechaActivacion: new Date().toISOString().split('T')[0]
  });

  // Cargar la configuración del POS desde el endpoint
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('http://localhost:8080/v1/configuracion');
        const data = response.data;
        
        // Adaptar los nombres de propiedades a nuestro formato
        setConfigData({
          modelo: data.modelo,
          codigoPOS: data.codigoPos,
          direccionMAC: data.direccionMac,
          codigoComercio: data.codigoComercio,
          fechaActivacion: new Date(data.fechaActivacion).toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('Error al cargar la configuración del POS:', error);
      }
    };
    
    fetchConfig();
  }, []);

  // Limpiar el campo de monto cuando se reinicie el formulario
  useEffect(() => {
    // Cuando ambos campos estén vacíos, asumimos que es un reset del formulario
    if (store.numeroTarjeta === '' && store.nombreTitular === '' && store.monto === 0) {
      setAmount('');
      setError('');
    }
  }, [store.numeroTarjeta, store.nombreTitular, store.monto]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir solo números y un punto decimal
    const value = e.target.value.replace(/[^\d.]/g, '');
    
    // Validar que solo haya un punto decimal
    const parts = value.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    
    setAmount(value);
    setError('');
    
    // Actualizar el monto en el store si es un número válido
    const parsedAmount = parseFloat(value);
    if (!isNaN(parsedAmount)) {
      store.setField('monto', parsedAmount);
    } else {
      store.setField('monto', 0);
    }
  };

  const handleProcessTransaction = () => {
    // Validaciones adicionales antes de procesar
    if (store.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    
    console.log('Iniciando procesamiento de transacción');
    console.log('Estado actual:', {
      monto: store.monto,
      moneda: store.moneda,
      isLoading: store.isLoading,
      error: store.error,
      success: store.success
    });
    
    // Si pasa todas las validaciones, procesa la transacción
    store.processTransaction();
  };

  // Log de estado para depuración
  useEffect(() => {
    console.log('Estado actualizado:', {
      isLoading: store.isLoading,
      error: store.error,
      success: store.success
    });
  }, [store.isLoading, store.error, store.success]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 p-4">
      {/* Terminal físico */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto bg-white dark:bg-black rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 relative"
        style={{ 
          minHeight: '700px',
          maxWidth: '400px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Overlay para estados de procesamiento */}
        <AnimatePresence>
          {store.isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
              style={{ borderRadius: 'inherit' }}
            >
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-white flex flex-col items-center"
              >
                <Loader2 className="h-16 w-16 animate-spin mb-4" />
                <p className="text-xl font-medium">Procesando pago...</p>
              </motion.div>
            </motion.div>
          )}

          {store.success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
              style={{ borderRadius: 'inherit' }}
            >
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-white flex flex-col items-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="bg-green-500 rounded-full p-3 mb-4"
                >
                  <Check className="h-12 w-12 text-white" />
                </motion.div>
                <p className="text-xl font-medium">¡Pago aprobado!</p>
              </motion.div>
            </motion.div>
          )}

          {store.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
              style={{ borderRadius: 'inherit' }}
            >
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-white flex flex-col items-center text-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="bg-red-500 rounded-full p-3 mb-4"
                >
                  {store.error.includes('conectar') ? (
                    <Wifi className="h-12 w-12 text-white" />
                  ) : (
                    <X className="h-12 w-12 text-white" />
                  )}
                </motion.div>
                <p className="text-xl font-medium">Pago rechazado</p>
                <p className="text-sm mt-2 max-w-xs">{store.error}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terminal Header */}
        <div className="bg-black dark:bg-black p-4 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <h1 className="text-lg font-bold">Terminal POS</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              className="text-white hover:text-gray-300 transition-colors"
              onClick={() => setConfigOpen(true)}
            >
              <Settings className="h-5 w-5" />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Terminal Screen */}
        <div className="p-5 space-y-6">
          {/* Entrada de monto */}
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
            <label className="block text-sm font-medium mb-2">Monto a cobrar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <Input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="pl-10 text-xl font-medium h-12 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
              />
            </div>
            {error && (
              <div className="flex items-center mt-2 text-red-500 text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Moneda */}
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-2">Moneda</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => store.setField('moneda', 'USD')}
                className={`h-10 flex items-center justify-center rounded-md transition-colors ${
                  store.moneda === 'USD' 
                  ? 'bg-black text-white dark:bg-white dark:text-black font-medium' 
                  : 'bg-transparent border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-1 text-inherit">$</span> 
                <span className="text-inherit">USD</span>
              </button>
              <button
                onClick={() => store.setField('moneda', 'EUR')}
                className={`h-10 flex items-center justify-center rounded-md transition-colors ${
                  store.moneda === 'EUR' 
                  ? 'bg-black text-white dark:bg-white dark:text-black font-medium' 
                  : 'bg-transparent border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-1 text-inherit">€</span>
                <span className="text-inherit">EUR</span>
              </button>
              <button
                onClick={() => store.setField('moneda', 'MXN')}
                className={`h-10 flex items-center justify-center rounded-md transition-colors ${
                  store.moneda === 'MXN' 
                  ? 'bg-black text-white dark:bg-white dark:text-black font-medium' 
                  : 'bg-transparent border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-1 text-inherit">$</span>
                <span className="text-inherit">MXN</span>
              </button>
            </div>
          </div>

          {/* Detalles de la tarjeta */}
          <CardForm onSubmit={handleProcessTransaction} />
        </div>

        {/* Terminal Footer */}
        <div className="p-4 mt-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>ID Terminal: {configData.codigoPOS}</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </motion.div>

      {/* Diálogo de Configuración */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración del Terminal
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Información técnica del dispositivo POS
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-1 border-b pb-2 border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Modelo</p>
              <p className="font-medium">{configData.modelo}</p>
            </div>
            
            <div className="space-y-1 border-b pb-2 border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Código POS</p>
              <p className="font-medium">{configData.codigoPOS}</p>
            </div>
            
            <div className="space-y-1 border-b pb-2 border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Dirección MAC</p>
              <p className="font-medium">{configData.direccionMAC}</p>
            </div>
            
            <div className="space-y-1 border-b pb-2 border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Código Comercio</p>
              <p className="font-medium">{configData.codigoComercio}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Activación</p>
              <p className="font-medium">{configData.fechaActivacion}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              onClick={() => setConfigOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 