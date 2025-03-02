"use client";

import { CardBrand } from '@/utils/helpers';
import { CreditCard } from 'lucide-react';
import { 
  FaCcVisa, 
  FaCcMastercard, 
  FaCcAmex, 
  FaCcDiscover, 
  FaCreditCard 
} from 'react-icons/fa';

interface CardBrandIconProps {
  brand: CardBrand;
  className?: string;
}

export const CardBrandIcon = ({ brand, className = '' }: CardBrandIconProps) => {
  const iconSize = className.includes('w-') ? undefined : 24;
  
  switch (brand) {
    case 'VISA':
      return <FaCcVisa className={className} size={iconSize} style={{ color: '#2566AF' }} />;
    case 'MAST':
      return <FaCcMastercard className={className} size={iconSize} style={{ color: '#FF5F00' }} />;
    case 'AMEX':
      return <FaCcAmex className={className} size={iconSize} style={{ color: '#016FD0' }} />;
    case 'DISC':
      return <FaCcDiscover className={className} size={iconSize} style={{ color: '#F27712' }} />;
    default:
      return <FaCreditCard className={className} size={iconSize} />;
  }
}; 