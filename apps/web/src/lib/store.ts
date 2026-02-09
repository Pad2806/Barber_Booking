import { create } from 'zustand';
import { Service, Staff, Salon } from '@/lib/api';

interface BookingState {
  salon: Salon | null;
  selectedServices: Service[];
  selectedStaff: Staff | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  note: string;
  currentStep: number;

  // Calculated
  totalDuration: number;
  totalAmount: number;

  // Actions
  setSalon: (salon: Salon) => void;
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  toggleService: (service: Service) => void;
  setStaff: (staff: Staff | null) => void;
  setDate: (date: string) => void;
  setTimeSlot: (timeSlot: string) => void;
  setNote: (note: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  isServiceSelected: (serviceId: string) => boolean;
}

const calculateTotals = (services: Service[]) => {
  return services.reduce(
    (acc, service) => ({
      totalDuration: acc.totalDuration + service.duration,
      totalAmount: acc.totalAmount + Number(service.price),
    }),
    { totalDuration: 0, totalAmount: 0 }
  );
};

export const useBookingStore = create<BookingState>((set, get) => ({
  salon: null,
  selectedServices: [],
  selectedStaff: null,
  selectedDate: null,
  selectedTimeSlot: null,
  note: '',
  currentStep: 1,
  totalDuration: 0,
  totalAmount: 0,

  setSalon: (salon) => set({ salon }),

  addService: (service) => {
    const { selectedServices } = get();
    if (selectedServices.some((s) => s.id === service.id)) return;
    const newServices = [...selectedServices, service];
    const { totalDuration, totalAmount } = calculateTotals(newServices);
    set({ selectedServices: newServices, totalDuration, totalAmount });
  },

  removeService: (serviceId) => {
    const { selectedServices } = get();
    const newServices = selectedServices.filter((s) => s.id !== serviceId);
    const { totalDuration, totalAmount } = calculateTotals(newServices);
    set({ selectedServices: newServices, totalDuration, totalAmount });
  },

  toggleService: (service) => {
    const { selectedServices, addService, removeService } = get();
    if (selectedServices.some((s) => s.id === service.id)) {
      removeService(service.id);
    } else {
      addService(service);
    }
  },

  setStaff: (staff) => set({ selectedStaff: staff }),

  setDate: (date) => set({ selectedDate: date, selectedTimeSlot: null }),

  setTimeSlot: (timeSlot) => set({ selectedTimeSlot: timeSlot }),

  setNote: (note) => set({ note }),

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 5) set({ currentStep: currentStep + 1 });
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) set({ currentStep: currentStep - 1 });
  },

  reset: () =>
    set({
      salon: null,
      selectedServices: [],
      selectedStaff: null,
      selectedDate: null,
      selectedTimeSlot: null,
      note: '',
      currentStep: 1,
      totalDuration: 0,
      totalAmount: 0,
    }),

  isServiceSelected: (serviceId) => {
    return get().selectedServices.some((s) => s.id === serviceId);
  },
}));
