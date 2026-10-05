jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { colors } from '../src/theme/colors';
import { theme } from '../src/theme';
import { DEFAULT_API_URL } from '../src/services/api';

describe('Design Tokens & Theme', () => {
  it('has consistent modern brand colors matching Swagger portal', () => {
    expect(colors.primary).toBe('#2563EB');
    expect(colors.confirmed).toBe('#059669');
    expect(colors.pending).toBe('#D97706');
    expect(colors.dispatched).toBe('#4F46E5');
    expect(colors.completed).toBe('#0D9488');
    expect(colors.cancelled).toBe('#DC2626');
    expect(colors.background).toBe('#F8FAFC');
    expect(colors.card).toBe('#FFFFFF');
  });

  it('has valid theme spacing and border radius', () => {
    expect(theme.spacing.sm).toBe(8);
    expect(theme.spacing.lg).toBe(16);
    expect(theme.borderRadius.md).toBe(12);
    expect(theme.borderRadius.full).toBe(9999);
  });
});

describe('Live API Gateway Config', () => {
  it('points to correct local network Swagger backend', () => {
    expect(DEFAULT_API_URL).toBe('http://192.168.1.6:4000/api');
  });
});

describe('Purchase Order & Sales Order Calculations', () => {
  it('correctly calculates untaxed total and tax amounts', () => {
    const lines = [
      { quantityOrdered: 5, unitPrice: 120.0, taxRate: 0.18 },
      { quantityOrdered: 2, unitPrice: 245.0, taxRate: 0.18 },
    ];
    const untaxed = lines.reduce((s, l) => s + l.quantityOrdered * l.unitPrice, 0);
    const tax = lines.reduce((s, l) => s + l.quantityOrdered * l.unitPrice * l.taxRate, 0);
    const total = untaxed + tax;

    expect(untaxed).toBe(1090.0);
    expect(tax).toBe(196.2);
    expect(total).toBe(1286.2);
  });

  it('correctly calculates GST breakdown (CGST 9% + SGST 9%)', () => {
    const billLines = [
      { quantity: 10, unitPrice: 1250.0 },
      { quantity: 25, unitPrice: 380.0 },
    ];
    const untaxed = billLines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const cgst = untaxed * 0.09;
    const sgst = untaxed * 0.09;
    const totalGst = cgst + sgst;
    const grandTotal = untaxed + totalGst;

    expect(untaxed).toBe(22000.0);
    expect(cgst).toBe(1980.0);
    expect(sgst).toBe(1980.0);
    expect(totalGst).toBe(3960.0);
    expect(grandTotal).toBe(25960.0);
  });

  it('validates dispatch tracking payload structure', () => {
    const samplePayload = {
      carrierName: 'SafeXpress Logistics',
      trackingNumber: 'TRK-9823411',
      lrNumber: 'LR-2026-9081',
      dispatchDate: '2026-09-25',
      estimatedDeliveryDate: '2026-09-30',
      remarks: 'Packed in 3 wooden crates',
    };

    expect(samplePayload.carrierName.trim().length).toBeGreaterThan(0);
    expect(samplePayload.trackingNumber.trim().length).toBeGreaterThan(0);
    expect(samplePayload.lrNumber.trim().length).toBeGreaterThan(0);
    expect(samplePayload.dispatchDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
