'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`border-slate-200 hover:border-slate-300 hover:bg-slate-50 ${
          currentPage === 1 
            ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400 hover:border-slate-200 hover:bg-transparent' 
            : ''
        }`}
      >
        Previous
      </Button>
      
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
        if (pageNum > totalPages) return null;
        
        return (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? 'default' : 'outline'}
            onClick={() => onPageChange(pageNum)}
            className={`${
              currentPage === pageNum 
                ? 'text-white' 
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
            style={currentPage === pageNum ? { background: 'var(--brand-gradient)' } : {}}
          >
            {pageNum}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`border-slate-200 hover:border-slate-300 hover:bg-slate-50 ${
          currentPage === totalPages 
            ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400 hover:border-slate-200 hover:bg-transparent' 
            : ''
        }`}
      >
        Next
      </Button>
    </div>
  );
}
