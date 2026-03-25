'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save, 
  Building, 
  CreditCard, 
  Bell, 
  Palette, 
  Loader2, 
  Clock, 
  ShieldCheck,
  Settings2
} from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUpload from '@/components/ImageUpload';
import { salonApi } from '@/lib/api';
import { Store, Check } from 'lucide-react';

export default function AdminSettingsPage(): JSX.Element {
  const { settings, isLoading, isSaving, updateField, saveSettings } = useSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const TABS = [
    { id: 'general', label: 'Tổng quan', icon: Building },
    { id: 'booking', label: 'Đặt lịch', icon: Clock },
    { id: 'payment', label: 'Thanh toán', icon: CreditCard },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'branding', label: 'Thương hiệu', icon: Palette },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-heading italic uppercase">Cấu hình hệ thống</h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">Quản lý toàn bộ cài đặt và tùy chỉnh trải nghiệm khách hàng.</p>
          </div>
        </div>
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="rounded-xl px-10 font-black h-12 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          LƯU CÀI ĐẶT
        </Button>
      </div>

      <Tabs defaultValue="general" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <TabsList className="lg:col-span-3 flex lg:flex-col bg-transparent h-auto p-0 gap-2 shrink-0 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
          {TABS.map(tab => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id}
              className="w-full justify-start gap-4 p-4 rounded-2xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-premium data-[state=active]:border-slate-100 border border-transparent hover:bg-white/50 text-slate-500 data-[state=active]:text-slate-900 group"
            >
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-400 group-data-[state=active]:bg-primary group-data-[state=active]:text-white transition-colors">
                <tab.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-left">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="lg:col-span-9">
          {/* General Tab */}
          <TabsContent value="general" className="mt-0 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Card className="border-none shadow-premium bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Thông tin cơ bản</CardTitle>
                <CardDescription>Các thông tin liên hệ chính thống của doanh nghiệp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Tên Barber Shop</label>
                    <Input 
                      value={settings.businessName || ''} 
                      onChange={e => updateField('businessName', e.target.value)}
                      className="rounded-xl h-12 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email quản trị</label>
                    <Input 
                      value={settings.contactEmail || ''} 
                      onChange={e => updateField('contactEmail', e.target.value)}
                      className="rounded-xl h-12 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Hotline liên hệ</label>
                    <Input 
                      value={settings.contactPhone || ''} 
                      onChange={e => updateField('contactPhone', e.target.value)}
                      className="rounded-xl h-12 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Website chính thức</label>
                    <Input 
                      value={settings.website || ''} 
                      onChange={e => updateField('website', e.target.value)}
                      className="rounded-xl h-12 border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Địa chỉ trụ sở</label>
                   <Textarea 
                     value={settings.address || ''} 
                     onChange={e => updateField('address', e.target.value)}
                     className="rounded-xl border-slate-200 min-h-[100px] py-3"
                   />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Config Tab */}
          <TabsContent value="booking" className="mt-0 space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Card className="border-none shadow-premium bg-white">
               <CardHeader>
                 <CardTitle className="text-lg font-bold">Cấu hình lịch hẹn</CardTitle>
                 <CardDescription>Thiết lập thời gian hoạt động và quy tắc đặt slot.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Giờ mở cửa mặc định</label>
                        <div className="flex items-center gap-4">
                           <input 
                             type="time" 
                             title="Opening time"
                             value={settings.defaultOpenTime || '08:00'} 
                             onChange={e => updateField('defaultOpenTime', e.target.value)}
                             className="rounded-xl h-12 border-slate-200 px-4 flex-1 border focus:ring-2 focus:ring-primary/20 outline-none"
                           />
                           <span className="text-slate-400 font-bold">đến</span>
                           <input 
                             type="time" 
                             title="Closing time"
                             value={settings.defaultCloseTime || '20:00'} 
                             onChange={e => updateField('defaultCloseTime', e.target.value)}
                             className="rounded-xl h-12 border-slate-200 px-4 flex-1 border focus:ring-2 focus:ring-primary/20 outline-none"
                           />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Thời gian mỗi Slot (phút)</label>
                        <select 
                           title="Slot duration"
                           value={settings.slotDuration || 30}
                           onChange={e => updateField('slotDuration', parseInt(e.target.value))}
                           className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                           <option value={15}>15 phút / slot</option>
                           <option value={30}>30 phút / slot</option>
                           <option value={45}>45 phút / slot</option>
                           <option value={60}>60 phút / slot</option>
                        </select>
                     </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="font-bold text-slate-800">Đặt lịch trước tối đa</p>
                           <p className="text-xs text-slate-500">Cho phép khách hàng đặt lịch trước bao nhiêu ngày.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Input 
                             type="number" 
                             value={settings.maxAdvanceDays || 30} 
                             onChange={e => updateField('maxAdvanceDays', parseInt(e.target.value))}
                             className="w-20 rounded-lg h-9 text-center font-bold"
                           />
                           <span className="text-xs font-bold text-slate-600">Ngày</span>
                        </div>
                     </div>
                     <div className="h-px bg-slate-200 w-full" />
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="font-bold text-slate-800">Thông báo nhắc lịch</p>
                           <p className="text-xs text-slate-500">Gửi nhắc nhở khách hàng trước giờ bắt đầu.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Input 
                             type="number" 
                             value={settings.reminderHours || 2} 
                             onChange={e => updateField('reminderHours', parseInt(e.target.value))}
                             className="w-20 rounded-lg h-9 text-center font-bold"
                           />
                           <span className="text-xs font-bold text-slate-600">Giờ</span>
                        </div>
                     </div>
                  </div>

                  {/* Shift Configuration - New Section */}
                  <Card className="border border-slate-100 shadow-none bg-slate-50/50">
                     <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Cấu hình ca làm việc</CardTitle>
                        <CardDescription>Thiết lập giờ cho từng ca. Giá trị này sẽ áp dụng khi xếp ca cho nhân viên.</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        {[
                           { label: 'Ca sáng', startKey: 'shiftMorningStart', endKey: 'shiftMorningEnd', defaultStart: '08:00', defaultEnd: '12:00' },
                           { label: 'Ca chiều', startKey: 'shiftAfternoonStart', endKey: 'shiftAfternoonEnd', defaultStart: '12:00', defaultEnd: '16:00' },
                           { label: 'Ca tối', startKey: 'shiftEveningStart', endKey: 'shiftEveningEnd', defaultStart: '16:00', defaultEnd: '20:00' },
                        ].map(shift => (
                           <div key={shift.label} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100">
                              <span className="text-sm font-bold text-slate-700 w-20 shrink-0">{shift.label}</span>
                              <input
                                 type="time"
                                 title={`${shift.label} start`}
                                 value={settings[shift.startKey] || shift.defaultStart}
                                 onChange={e => updateField(shift.startKey, e.target.value)}
                                 className="rounded-lg h-10 border-slate-200 px-3 flex-1 border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                              />
                              <span className="text-slate-400 font-bold text-xs">đến</span>
                              <input
                                 type="time"
                                 title={`${shift.label} end`}
                                 value={settings[shift.endKey] || shift.defaultEnd}
                                 onChange={e => updateField(shift.endKey, e.target.value)}
                                 className="rounded-lg h-10 border-slate-200 px-3 flex-1 border focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                              />
                           </div>
                        ))}
                     </CardContent>
                  </Card>
               </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment" className="mt-0 animate-in slide-in-from-right-4 duration-300">
             <Card className="border-none shadow-premium bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Cổng thanh toán tự động</CardTitle>
                  <CardDescription>Cấu hình VietQR và tích hợp Sepay nhận diện giao dịch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500">
                         <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-emerald-900">Bảo mật tuyệt đối</p>
                         <p className="text-[11px] text-emerald-700">Thông tin API Key được mã hóa AES-256 trước khi lưu.</p>
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Ngân hàng thụ hưởng</label>
                         <Input 
                           value={settings.bankName || ''} 
                           onChange={e => updateField('bankName', e.target.value)}
                           placeholder="VD: MB Bank, Vietcombank..."
                           className="rounded-xl h-12"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Mã ngân hàng (BIN)</label>
                         <Input 
                           value={settings.bankCode || ''} 
                           onChange={e => updateField('bankCode', e.target.value)}
                           placeholder="VD: MB, VCB, TCB..."
                           className="rounded-xl h-12"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Số tài khoản</label>
                         <Input 
                           value={settings.bankAccount || ''} 
                           onChange={e => updateField('bankAccount', e.target.value)}
                           className="rounded-xl h-12"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Chủ tài khoản (KO DẤU)</label>
                         <Input 
                           value={settings.bankAccountName || ''} 
                           onChange={e => updateField('bankAccountName', e.target.value)}
                           className="rounded-xl h-12 uppercase"
                         />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Sepay API Key</label>
                         <Input 
                           type="password"
                           value={settings.sepayApiKey || ''} 
                           onChange={e => updateField('sepayApiKey', e.target.value)}
                           placeholder="••••••••••••••••"
                           className="rounded-xl h-12"
                         />
                      </div>
                   </div>

                    {/* Bank Mode */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                       <div>
                          <p className="font-bold text-slate-800">Chế độ tài khoản ngân hàng</p>
                          <p className="text-xs text-slate-500">Chọn cách quản lý tài khoản nhận thanh toán cho các chi nhánh.</p>
                       </div>
                       <div className="grid md:grid-cols-2 gap-3">
                          {[
                            { value: 'UNIFIED', label: '1 TK chung', desc: 'Tất cả chi nhánh dùng tài khoản ở trên' },
                            { value: 'PER_BRANCH', label: 'Riêng từng CN', desc: 'Mỗi chi nhánh cấu hình TK riêng' },
                          ].map(mode => (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() => updateField('bankMode', mode.value)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                (settings.bankMode || 'UNIFIED') === mode.value
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <p className="font-bold text-sm text-slate-800">{mode.label}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{mode.desc}</p>
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Default Transfer Template */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                       <div>
                          <p className="font-bold text-slate-800">Mẫu nội dung CK mặc định</p>
                          <p className="text-xs text-slate-500">Nhấn vào biến bên dưới để thêm vào mẫu. Nhấn ✕ để xóa.</p>
                       </div>
                       <Input
                         value={settings.defaultTransferTemplate || '{cn} {ma}'}
                         onChange={e => updateField('defaultTransferTemplate', e.target.value)}
                         placeholder="{cn} {ma}"
                         className="rounded-xl h-12 font-mono"
                       />
                       <div className="flex flex-wrap gap-2">
                          {[
                            { v: '{cn}', d: 'Mã chi nhánh' },
                            { v: '{ma}', d: 'Mã booking' },
                            { v: '{ten}', d: 'Tên khách' },
                            { v: '{tien}', d: 'Số tiền' },
                          ].map(item => {
                            const tpl = settings.defaultTransferTemplate || '{cn} {ma}';
                            const isActive = tpl.includes(item.v);
                            return (
                              <button
                                key={item.v}
                                type="button"
                                onClick={() => {
                                  if (isActive) {
                                    const newTpl = tpl.replace(new RegExp(item.v.replace(/[{}]/g, '\\$&'), 'g'), '').replace(/\s+/g, ' ').trim();
                                    updateField('defaultTransferTemplate', newTpl);
                                  } else {
                                    updateField('defaultTransferTemplate', (tpl + ' ' + item.v).trim());
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                                  isActive
                                    ? 'bg-primary/10 border-2 border-primary/30 text-primary font-semibold shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-500 hover:border-primary/30 hover:bg-primary/5'
                                }`}
                              >
                                <code className="font-mono font-bold">{item.v}</code>
                                <span className={isActive ? 'text-primary/70' : 'text-slate-400'}>= {item.d}</span>
                                {isActive && (
                                  <span className="ml-1 text-primary/50 hover:text-red-400 text-[10px] font-bold">✕</span>
                                )}
                              </button>
                            );
                          })}
                       </div>
                    </div>

                    {/* Per-Branch Template Override */}
                    <PerBranchTemplateConfig />
                </CardContent>
             </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0 animate-in slide-in-from-right-4 duration-300">
             <Card className="border-none shadow-premium bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Kênh thông báo</CardTitle>
                  <CardDescription>Thông báo sẽ gửi đến tất cả nhân viên liên quan trong salon (Manager, Barber, Cashier...).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {[
                     { id: 'notify_new_booking', label: 'Đặt lịch mới', desc: 'Nhận thông báo khi khách vừa hoàn tất đặt lịch.' },
                     { id: 'notify_payment', label: 'Thanh toán', desc: 'Nhận thông báo khi có tiền đổ vào tài khoản.' },
                     { id: 'notify_review', label: 'Đánh giá mới', desc: 'Thông báo khi khách hàng để lại bình luận.' },
                   ].map(item => (
                     <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                              <Bell className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800">{item.label}</p>
                              <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                           </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings[item.id] || false}
                            onChange={e => updateField(item.id, e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                        </label>
                     </div>
                   ))}
                </CardContent>
             </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="mt-0 animate-in slide-in-from-right-4 duration-300">
             <Card className="border-none shadow-premium bg-white">
                <CardHeader>
                   <CardTitle className="text-lg font-bold">Giao diện & Thương hiệu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 block">Logo chính thức</label>
                         <ImageUpload
                            value={settings.logo || ''}
                            onChange={(url) => updateField('logo', url)}
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 block">Màu sắc chủ đạo</label>
                         <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 h-28">
                            <div className="h-16 w-16 rounded-2xl shadow-xl border-2 border-white ring-1 ring-slate-200" style={{ backgroundColor: settings.primaryColor || '#D4A574' }}>
                               <input 
                                 type="color" 
                                 title="Primary color"
                                 value={settings.primaryColor || '#D4A574'}
                                 onChange={e => updateField('primaryColor', e.target.value)}
                                 className="w-full h-full opacity-0 cursor-pointer" 
                               />
                            </div>
                            <div className="flex-1">
                               <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{settings.primaryColor || '#D4A574'}</p>
                               <p className="text-[9px] text-slate-400 font-medium">Click vào ô màu để thay đổi</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function deriveBranchCode(slug: string): string {
  const parts = slug.split('-');
  const meaningful = parts.length > 1 ? parts.slice(1) : parts;
  return meaningful.map(p => p.charAt(0).toUpperCase()).join('');
}

function PerBranchTemplateConfig() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: salonsData } = useQuery({
    queryKey: ['admin-salons-templates'],
    queryFn: () => salonApi.getAll({ limit: 50 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, template }: { id: string; template: string }) =>
      salonApi.update(id, { transferTemplate: template || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-salons-templates'] });
      setEditingId(null);
    },
  });

  const salons = salonsData?.data || [];
  if (salons.length === 0) return null;

  const TEMPLATE_VARS = [
    { v: '{cn}', d: 'Mã CN' },
    { v: '{ma}', d: 'Mã booking' },
    { v: '{ten}', d: 'Tên khách' },
    { v: '{tien}', d: 'Số tiền' },
  ];

  const getPresets = (code: string) => [
    { label: '📋 Mã CN + Mã booking', value: `${code} {ma}` },
    { label: '👤 Mã CN + Tên khách + Mã booking', value: `${code} {ten} {ma}` },
    { label: '💰 Mã CN + Mã booking + Số tiền', value: `${code} {ma} {tien}` },
    { label: '⚙️ Tùy chỉnh...', value: '__custom__' },
  ];

  const renderPreview = (tpl: string, code: string) => {
    if (!tpl) return null;
    const preview = tpl
      .replace(/\{cn\}/g, code)
      .replace(/\{ma\}/g, 'RBMN5X3N')
      .replace(/\{ten\}/g, 'NGUYEN A')
      .replace(/\{tien\}/g, '150000');
    return (
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] text-slate-400">Xem trước:</span>
        <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">{preview}</span>
      </div>
    );
  };

  const toggleVar = (variable: string) => {
    if (editValue.includes(variable)) {
      setEditValue(editValue.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), '').replace(/\s+/g, ' ').trim());
    } else {
      setEditValue((editValue + ' ' + variable).trim());
    }
  };

  return (
    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
      <div>
        <p className="font-bold text-slate-800">Nội dung CK từng chi nhánh</p>
        <p className="text-xs text-slate-500">Nếu để trống, chi nhánh sẽ dùng mẫu mặc định phía trên.</p>
      </div>
      <div className="space-y-2">
        {salons.map((salon: any) => {
          const code = deriveBranchCode(salon.slug);
          const isEditing = editingId === salon.id;
          return (
            <div key={salon.id} className={`p-4 bg-white rounded-xl border transition-all ${isEditing ? 'border-primary/30 shadow-sm' : 'border-slate-100'}`}>
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">{salon.name}</p>
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded shrink-0">{code}</span>
                  </div>
                  {!isEditing && (
                    <p
                      className="text-xs text-slate-400 mt-0.5 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => { setEditingId(salon.id); setEditValue(salon.transferTemplate || ''); }}
                    >
                      {salon.transferTemplate
                        ? <span className="font-mono text-slate-600">{salon.transferTemplate}</span>
                        : 'Dùng mẫu mặc định — nhấn để tùy chỉnh'}
                    </p>
                  )}
                </div>
              </div>

              {/* Editing Panel */}
              {isEditing && (
                <div className="mt-3 pl-12 space-y-3">
                  {/* Preset Dropdown */}
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 mb-1.5">Chọn mẫu có sẵn:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {getPresets(code).map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            if (preset.value === '__custom__') {
                              setEditValue(editValue || `${code} {ma}`);
                            } else {
                              setEditValue(preset.value);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${
                            editValue === preset.value
                              ? 'bg-primary text-white font-semibold shadow-sm'
                              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-primary/30 hover:bg-primary/5'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Tags Builder */}
                  {editValue && !getPresets(code).slice(0, -1).some(p => p.value === editValue) && (
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 mb-1.5">Tùy chỉnh — nhấn để thêm/bỏ biến:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TEMPLATE_VARS.map(item => {
                          const isActive = editValue.includes(item.v);
                          return (
                            <button
                              key={item.v}
                              type="button"
                              onClick={() => toggleVar(item.v)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                                isActive
                                  ? 'bg-primary/10 border-2 border-primary/30 text-primary font-semibold'
                                  : 'bg-white border border-slate-200 text-slate-500 hover:border-primary/30'
                              }`}
                            >
                              <code className="font-mono font-bold">{item.v}</code>
                              <span className="text-[10px]">{item.d}</span>
                              {isActive && <span className="text-primary/50 hover:text-red-400 text-[10px] font-bold">✕</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Template Input (read-only for preset, editable for custom) */}
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={`VD: ${code} {ma}`}
                    className="h-8 text-xs font-mono rounded-lg"
                  />

                  {/* Live Preview */}
                  {editValue && renderPreview(editValue, code)}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="h-8 px-4 text-xs"
                      onClick={() => updateMutation.mutate({ id: salon.id, template: editValue })}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" /> Lưu
                    </Button>
                    {salon.transferTemplate && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs text-slate-500"
                        onClick={() => {
                          setEditValue('');
                          updateMutation.mutate({ id: salon.id, template: '' });
                        }}
                      >
                        Dùng mặc định
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 ml-auto"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
