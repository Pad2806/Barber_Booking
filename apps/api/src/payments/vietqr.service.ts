import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VietQRParams {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export interface VietQRResult {
  qrCode: string; // Base64 image or URL
  qrContent: string; // Raw QR content
  bankCode: string;
  accountNumber: string;
}

@Injectable()
export class VietQRService {
  private readonly apiUrl = 'https://img.vietqr.io/image';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate VietQR code URL
   * Format: https://img.vietqr.io/image/{bankCode}-{accountNumber}-{template}.png?amount={amount}&addInfo={description}&accountName={accountName}
   */
  generateQRCodeUrl(params: VietQRParams): string {
    const {
      bankCode,
      accountNumber,
      accountName,
      amount,
      description,
      template = 'compact2',
    } = params;

    const encodedDescription = encodeURIComponent(description);
    const encodedAccountName = encodeURIComponent(accountName);

    return `${this.apiUrl}/${bankCode}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${encodedDescription}&accountName=${encodedAccountName}`;
  }

  /**
   * Generate raw VietQR content string (EMVCo format)
   * This can be used to generate QR locally
   */
  generateQRContent(params: VietQRParams): string {
    const { bankCode, accountNumber, amount, description } = params;

    // VietQR EMVCo format
    // This is a simplified version - full implementation would include more fields
    const content = [
      '000201', // Payload Format Indicator
      '010212', // Point of Initiation Method (dynamic)
      `38${this.formatField(this.generateVietQRData(bankCode, accountNumber))}`,
      `52${this.formatField('5999')}`, // MCC
      '5303704', // Transaction Currency (VND)
      `54${this.formatField(amount.toString())}`, // Amount
      '5802VN', // Country Code
      `62${this.formatField(`08${this.formatField(description)}`)}`, // Additional Data
    ].join('');

    // CRC would need to be calculated
    return content + '6304' + this.calculateCRC(content + '6304');
  }

  private generateVietQRData(bankCode: string, accountNumber: string): string {
    const vietQRService = `0010A000000727`;
    const bankInfo = `01${this.formatField(this.getBankBin(bankCode))}`;
    const accountInfo = `02${this.formatField(accountNumber)}`;
    return vietQRService + bankInfo + accountInfo;
  }

  private formatField(value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return length + value;
  }

  private getBankBin(bankCode: string): string {
    // Map bank codes to BINs (Bank Identification Numbers)
    const bankBins: Record<string, string> = {
      VCB: '970436', // Vietcombank
      TCB: '970407', // Techcombank
      MB: '970422', // MB Bank
      ACB: '970416', // ACB
      VPB: '970432', // VPBank
      TPB: '970423', // TPBank
      STB: '970403', // Sacombank
      VIB: '970441', // VIB
      SHB: '970443', // SHB
      MSB: '970426', // MSB
      HDB: '970437', // HDBank
      OCB: '970448', // OCB
      BIDV: '970418', // BIDV
      CTG: '970415', // Vietinbank
      ABB: '970425', // ABBank
      BAB: '970409', // BacABank
      VAB: '970427', // VietABank
      NAB: '970428', // NamABank
      SCB: '970429', // SCB
      PVCB: '970412', // PVcomBank
      VRB: '970421', // VRB
      SEAB: '970440', // SeABank
      CIMB: '422589', // CIMB
      EIB: '970431', // Eximbank
      KLB: '970452', // KienLongBank
      LPB: '970449', // LPBank
    };

    return bankBins[bankCode.toUpperCase()] || bankCode;
  }

  private calculateCRC(str: string): string {
    // CRC-16/CCITT-FALSE calculation
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  }
}
