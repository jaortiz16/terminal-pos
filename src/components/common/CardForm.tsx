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

  useEffect(() => {
    if (store.numeroTarjeta === '' && store.nombreTitular === '') {
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setExpiryError('');
    }
  }, [store.numeroTarjeta, store.nombreTitular]);

  useEffect(() => {
    if (!store.error && !store.success && !store.isLoading && 
        store.numeroTarjeta === '' && store.nombreTitular === '') {
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setExpiryError('');
    }
  }, [store.error, store.success, store.isLoading, store.numeroTarjeta, store.nombreTitular]);

  useEffect(() => {
    if (cardNumber) {
      const brand = detectCardBrand(cardNumber);
      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      store.setField('marca', brand);
      store.setField('numeroTarjeta', cleanCardNumber);
    } else {
      store.setField('marca', 'unknown');
    }
  }, [cardNumber]); 

  useEffect(() => {
    if (store.modalidad === 'DIF' && !store.plazo) {
      store.setField('plazo', 3);
      console.log('Estableciendo plazo por defecto en useEffect:', 3);
    }
  }, [store.modalidad]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 16) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d/]/g, '');
    const formatted = formatExpiryDate(value);
    setExpiryDate(formatted);
    validateExpiryDate(formatted);
    store.setField('fechaExpiracion', formatted);
  };

  const validateExpiryDate = (date: string) => {
    if (date.length === 5) { 
      const [month, year] = date.split('/');
      const expiryMonth = parseInt(month, 10);
      const expiryYear = parseInt('20' + year, 10);
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; 
      const currentYear = currentDate.getFullYear();
      
      if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        setExpiryError('La tarjeta ha caducado');
      } else {
        setExpiryError('');
      }
    }
  };

  const handleModeChange = (value: string) => {
    if (value === 'COR') {
      store.setField('modalidad', 'SIM');
      store.setField('plazo', undefined);
      store.setField('frecuenciaDias', undefined);
    } else if (value === 'DIF') {
      store.setField('modalidad', 'DIF');
      store.setField('plazo', 3);
      console.log('Estableciendo plazo por defecto en handleModeChange:', 3);
      store.setField('frecuenciaDias', undefined);
    } else if (value === 'REC') {
      store.setField('modalidad', 'REC');
      store.setField('frecuenciaDias', 30);
      store.setField('plazo', undefined);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) { 
      setCvv(value);
      store.setField('cvv', value);
    }
  };

  const handleSubmit = () => {
    if (cvv.length < 3) {
      const paddedCvv = cvv.padStart(3, '0');
      setCvv(paddedCvv);
      store.setField('cvv', paddedCvv);
    }

    if (onSubmit) {
      onSubmit();
    } else {
      store.processTransaction();
    }
  };

  useEffect(() => {
    if (store.modalidad === 'DIF') {
      if (!store.plazo || store.plazo <= 0) {
        console.log("Estableciendo plazo por defecto: 3 meses");
        store.setField('plazo', 3);
      }
    }
  }, [store.modalidad]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-5">
    
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <h2 className="text-xl font-medium">Detalles de pago</h2>
        </div>
        
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
                <div className="space-y-2">
                  <Label htmlFor="plazo" className="text-sm">Cuotas</Label>
                  <Select 
                    onValueChange={(value) => {
                      const plazo = parseInt(value, 10);
                      store.setField('plazo', plazo);
                      console.log('Plazo seleccionado:', plazo);
                    }} 
                    defaultValue="3"
                    value={store.plazo?.toString() || "3"}
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

        <Button 
          className="w-full bg-black text-white dark:bg-white dark:text-black mt-6 h-12"
          onClick={handleSubmit}
          disabled={store.isLoading || !cardNumber || !store.nombreTitular || (expiryError ? true : false)}
        >
          {store.isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Procesando...</span>
            </div>
          ) : (
            <span>Procesar transacción</span>
          )}
        </Button>

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