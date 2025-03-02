"use client";

import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { detectCardBrand, formatCardNumber, formatExpiryDate } from '@/utils/helpers';
import { useTransactionStore } from '@/store/useTransactionStore';
import { CardBrandIcon } from './CardBrandIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, CreditCard, X } from 'lucide-react';

interface CardFormProps {
  onSubmit?: () => void;
}

export const CardForm = ({ onSubmit }: CardFormProps) => {
  const store = useTransactionStore();
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiryError, setExpiryError] = useState('');

  // Limpiar campos locales cuando el store se resetea
  useEffect(() => {
    // Si el numeroTarjeta y nombreTitular del store están vacíos, es un reset
    if (store.numeroTarjeta === '' && store.nombreTitular === '') {
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setExpiryError('');
    }
  }, [store.numeroTarjeta, store.nombreTitular]);

  // Detectar la marca de la tarjeta al cambiar el número
  useEffect(() => {
    if (cardNumber) {
      const brand = detectCardBrand(cardNumber);
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      // Usar setter para actualizar valores sin crear dependencia circular
      store.setField('marca', brand);
      store.setField('numeroTarjeta', cleanCardNumber);
    } else {
      // Si el número de tarjeta está vacío, reiniciar la marca
      store.setField('marca', 'unknown');
    }
  }, [cardNumber]);  // Quitado 'store' de las dependencias para evitar bucle

  // Manejar el cambio del número de tarjeta
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 16) {
      setCardNumber(formatCardNumber(value));
    }
  };

  // Manejar el cambio de la fecha de vencimiento
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d/]/g, '');
    setExpiryDate(formatExpiryDate(value));
    validateExpiryDate(formatExpiryDate(value));
  };

  // Validar que la fecha de caducidad sea mayor a la fecha actual
  const validateExpiryDate = (date: string) => {
    if (date.length === 5) { // Formato MM/YY completo
      const [month, year] = date.split('/');
      const expiryMonth = parseInt(month, 10);
      const expiryYear = parseInt('20' + year, 10);
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() devuelve 0-11
      const currentYear = currentDate.getFullYear();
      
      if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        setExpiryError('La tarjeta ha caducado');
      } else {
        setExpiryError('');
      }
    }
  };

  // Manejar cambio de modalidad de pago
  const handleModeChange = (value: string) => {
    // Mapear los valores de UI a los valores que espera el backend
    if (value === 'COR') {
      store.setField('modalidad', 'SIM'); // COR -> SIM en el backend
    } else {
      store.setField('modalidad', value as any);
    }
  };

  // Manejar cambio de CVV
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) { // Limitado a 3 dígitos
      setCvv(value);
    }
  };

  // Manejar el proceso de pago con validaciones
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    } else {
      store.processTransaction();
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-5">
        {/* Título del formulario */}
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <h2 className="text-xl font-medium">Detalles de pago</h2>
        </div>
        
        {/* Nombre del propietario */}
        <div className="space-y-2">
          <Label htmlFor="nombreTitular" className="text-sm">Nombre propietario</Label>
          <Input
            id="nombreTitular"
            placeholder="Nombre completo del titular"
            value={store.nombreTitular}
            onChange={(e) => store.setField('nombreTitular', e.target.value)}
            className="border-gray-300 dark:border-gray-700 bg-transparent"
          />
        </div>

        {/* Número de tarjeta con detección de marca */}
        <div className="space-y-2">
          <Label htmlFor="numeroTarjeta" className="text-sm">N# tarjeta</Label>
          <div className="relative">
            <Input
              id="numeroTarjeta"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className="pr-10 border-gray-300 dark:border-gray-700 bg-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CardBrandIcon brand={store.marca} className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Fecha y CVV en fila */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fechaCaducidad" className="text-sm">Fecha caducidad</Label>
            <Input
              id="fechaCaducidad"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={handleExpiryChange}
              maxLength={5}
              className={`border-gray-300 dark:border-gray-700 bg-transparent ${expiryError ? 'border-red-500 dark:border-red-500' : ''}`}
            />
            {expiryError && (
              <p className="text-red-500 text-xs mt-1">{expiryError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv" className="text-sm">CVV</Label>
            <Input
              id="cvv"
              type="text"
              placeholder="000"
              value={cvv}
              onChange={handleCvvChange}
              maxLength={3}
              className="border-gray-300 dark:border-gray-700 bg-transparent"
            />
          </div>
        </div>

        {/* Modalidad de pago con tabs */}
        <div className="pt-2">
          <Tabs defaultValue="COR" onValueChange={handleModeChange} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-gray-100 dark:bg-black">
              <TabsTrigger value="COR" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Corriente</TabsTrigger>
              <TabsTrigger value="DIF" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Diferido</TabsTrigger>
              <TabsTrigger value="REC" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">Recurrente</TabsTrigger>
            </TabsList>
            
            <TabsContent value="COR">
              <div className="py-2 text-sm text-gray-500 dark:text-gray-400">
                Pago en una sola cuota
              </div>
            </TabsContent>
            
            <TabsContent value="DIF">
              <div className="py-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="diferido" 
                    checked 
                  />
                  <Label htmlFor="diferido" className="text-sm font-normal">Diferido</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plazo" className="text-sm">Cuotas</Label>
                  <Select 
                    onValueChange={(value) => store.setField('plazo', parseInt(value))} 
                    defaultValue="3"
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-700 bg-transparent">
                      <SelectValue placeholder="Seleccione plazo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="9">9 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="REC">
              <div className="py-2 space-y-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Configuración de pago recurrente
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frecuencia" className="text-sm">Frecuencia (días)</Label>
                  <Select 
                    onValueChange={(value) => store.setField('frecuenciaDias', parseInt(value))} 
                    defaultValue="30"
                  >
                    <SelectTrigger className="border-gray-300 dark:border-gray-700 bg-transparent">
                      <SelectValue placeholder="Seleccione frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Semanal (7 días)</SelectItem>
                      <SelectItem value="15">Quincenal (15 días)</SelectItem>
                      <SelectItem value="30">Mensual (30 días)</SelectItem>
                      <SelectItem value="90">Trimestral (90 días)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Botón de procesamiento */}
        <Button 
          className="w-full mt-4 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          disabled={
            store.isLoading || 
            !store.nombreTitular || 
            !cardNumber || 
            !expiryDate || 
            !cvv || 
            !!expiryError || 
            store.monto <= 0
          }
          onClick={handleSubmit}
        >
          Procesar Pago
        </Button>

        {/* Botón de cancelar */}
        <Button 
          variant="outline"
          className="w-full border-gray-300 dark:border-gray-700"
          onClick={() => store.resetForm()}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}; 