import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BarcodeScannerComponent } from './barcode-scanner';

describe('BarcodeScannerComponent', () => {
  let component: BarcodeScannerComponent;
  let fixture: ComponentFixture<BarcodeScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarcodeScannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarcodeScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit scanned code and trigger vibration on valid decode', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      configurable: true,
      writable: true,
    });

    const emitSpy = vi.spyOn(component.codeScanned, 'emit');

    component.handleDecodedText(' 123456 ');

    expect(emitSpy).toHaveBeenCalledWith('123456');
    expect(vibrateMock).toHaveBeenCalledWith(150);
    expect(component.lastScannedValue).toBe('123456');
  });

  it('should ignore duplicate consecutive scans within cooldown window', () => {
    const emitSpy = vi.spyOn(component.codeScanned, 'emit');

    component.handleDecodedText('123456');
    component.handleDecodedText('123456');

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should allow consecutive scans of different codes immediately', () => {
    const emitSpy = vi.spyOn(component.codeScanned, 'emit');

    component.handleDecodedText('123456');
    component.handleDecodedText('654321');

    expect(emitSpy).toHaveBeenCalledTimes(2);
    expect(emitSpy).toHaveBeenNthCalledWith(1, '123456');
    expect(emitSpy).toHaveBeenNthCalledWith(2, '654321');
  });
});

