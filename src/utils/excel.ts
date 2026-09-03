import * as XLSX from 'xlsx';

export const getXLSX = () => {
  if (typeof window !== 'undefined' && (window as any).XLSX) {
    return (window as any).XLSX;
  }
  return XLSX;
};

export { XLSX };
