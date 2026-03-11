'use client';

import { useState } from 'react';
import { 
  Save, 
  Building, 
  CreditCard, 
  Bell, 
  Shield, 
  Palette, 
  Loader2, 
  Clock, 
  Check, 
  Smartphone,
  ShieldCheck,
  Globe,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSettingsPage() {
  const { settings, isLoading, isSaving, updateField, saveSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');

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
                           <Input 
                             type="time" 
                             value={settings.defaultOpenTime || '08:00'} 
                             onChange={e => updateField('defaultOpenTime', e.target.value)}
                             className="rounded-xl h-12 border-slate-200"
                           />
                           <span className="text-slate-400 font-bold">đến</span>
                           <Input 
                             type="time" 
                             value={settings.defaultCloseTime || '20:00'} 
                             onChange={e => updateField('defaultCloseTime', e.target.value)}
                             className="rounded-xl h-12 border-slate-200"
                           />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Thời gian mỗi Slot (phút)</label>
                        <select 
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
                      <div className="space-y-2">
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
                </CardContent>
             </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0 animate-in slide-in-from-right-4 duration-300">
             <Card className="border-none shadow-premium bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Kênh thông báo</CardTitle>
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
                         <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
                            <Building className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tải ảnh lên</p>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 block">Màu sắc chủ đạo</label>
                         <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 h-28">
                            <div className="h-16 w-16 rounded-2xl shadow-xl border-2 border-white ring-1 ring-slate-200" style={{ backgroundColor: settings.primaryColor || '#D4A574' }}>
                               <input 
                                 type="color" 
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
