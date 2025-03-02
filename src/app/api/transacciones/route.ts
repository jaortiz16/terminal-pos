import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Transaction } from '@/utils/helpers';

export async function POST(request: NextRequest) {
  try {
    const data: Transaction = await request.json();
    
    // Validación básica
    if (!data.monto || data.monto <= 0) {
      return NextResponse.json(
        { message: 'El monto debe ser mayor a cero' },
        { status: 400 }
      );
    }
    
    if (!data.numeroTarjeta || data.numeroTarjeta.length < 13) {
      return NextResponse.json(
        { message: 'Número de tarjeta inválido' },
        { status: 400 }
      );
    }
    
    if (!data.nombreTitular) {
      return NextResponse.json(
        { message: 'El nombre del titular es requerido' },
        { status: 400 }
      );
    }
    
    // Simulamos una demora y probabilidad de éxito (90%)
    await new Promise(resolve => setTimeout(resolve, 1500));
    const success = Math.random() <= 0.9;
    
    if (!success) {
      return NextResponse.json(
        { message: 'Transacción rechazada por el banco emisor' },
        { status: 400 }
      );
    }
    
    // Simular una respuesta exitosa
    return NextResponse.json({
      id: `TX-${Date.now()}`,
      ...data,
      estado: 'APROBADO',
      fechaProcesamiento: new Date().toISOString(),
      codigoAutorizacion: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
    });
    
  } catch (error) {
    console.error('Error al procesar la transacción:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 