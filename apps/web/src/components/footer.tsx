'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white text-black py-24 border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-heading font-black text-3xl mb-8 tracking-tighter uppercase italic">
              REETRO<span className="bg-black text-white px-2 ml-1">BARBER</span>
            </h3>
            <p className="text-gray-400 text-xs uppercase font-black tracking-widest leading-relaxed">
              Hệ thống salon tóc nam chuyên nghiệp hàng đầu Việt Nam. Nâng tầm phong cách quý ông Việt.
            </p>
          </div>
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-8 text-gray-300">DISCOVER</h4>
            <ul className="space-y-4 text-[10px] font-black uppercase tracking-[0.2em]">
              <li><Link href="/about" className="text-gray-900 hover:text-gray-400 transition-colors">VỀ CHÚNG TÔI</Link></li>
              <li><Link href="/careers" className="text-gray-900 hover:text-gray-400 transition-colors">TUYỂN DỤNG</Link></li>
              <li><Link href="/franchise" className="text-gray-900 hover:text-gray-400 transition-colors">NHƯỢNG QUYỀN</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-8 text-gray-300">SERVICES</h4>
            <ul className="space-y-4 text-[10px] font-black uppercase tracking-[0.2em]">
              <li><Link href="/services" className="text-gray-900 hover:text-gray-400 transition-colors">HAIR CUT</Link></li>
              <li><Link href="/services" className="text-gray-900 hover:text-gray-400 transition-colors">STYLING & COLOR</Link></li>
              <li><Link href="/services" className="text-gray-900 hover:text-gray-400 transition-colors">LUXURY COMBO</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-[10px] uppercase tracking-[0.4em] mb-8 text-gray-300">CONTACT</h4>
            <ul className="space-y-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
              <li className="flex items-center gap-2">HOTLINE: <span className="font-mono italic">1900.27.27.30</span></li>
              <li className="flex items-center gap-2">EMAIL: <span className="font-mono italic">CONTACT@REETRO.VN</span></li>
              <li className="flex items-center gap-2">OPEN: <span className="font-mono italic">08:30 - 20:30</span></li>
            </ul>
          </div>
        </div>
        <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">© 2024 REETRO BARBER CO. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-10">
            <Link href="/privacy" className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] hover:text-black transition-colors">PRIVACY POLICY</Link>
            <Link href="/terms" className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] hover:text-black transition-colors">TERMS OF SERVICE</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
