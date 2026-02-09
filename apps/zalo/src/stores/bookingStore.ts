import { create } from 'zustand';
import type { Service } from '../services/service.service';
import type { Staff } from '../services/staff.service';
import type { Salon } from '../services/salon.service';

export interface BookingState {
  // Selected data
  salon: Salon | null;
  selectedServices: Service[];
  selectedStaff: Staff | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  note: string;

  // Calculated values
  totalDuration: number;
  totalAmount: number;

  // Current step (1-5)
  currentStep: number;

  // Actions
  setSalon: (salon: Salon) => void;
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  clearServices: () => void;
  setStaff: (staff: Staff | null) => void;
  setDate: (date: string) => void;
  setTimeSlot: (timeSlot: string) => void;
  setNote: (note: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  canProceed: () => boolean;
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
  totalDuration: 0,
  totalAmount: 0,
  currentStep: 1,

  setSalon: (salon) => {
    set({ salon, currentStep: 2 });
  },

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

  clearServices: () => {
    set({ selectedServices: [], totalDuration: 0, totalAmount: 0 });
  },

  setStaff: (staff) => {
    set({ selectedStaff: staff });
  },

  setDate: (date) => {
    set({ selectedDate: date, selectedTimeSlot: null });
  },

  setTimeSlot: (timeSlot) => {
    set({ selectedTimeSlot: timeSlot });
  },

  setNote: (note) => {
    set({ note });
  },

  setStep: (step) => {
    if (step >= 1 && step <= 5) {
      set({ currentStep: step });
    }
  },

  nextStep: () => {
    const { currentStep, canProceed } = get();
    if (canProceed() && currentStep < 5) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  reset: () => {
    set({
      salon: null,
      selectedServices: [],
      selectedStaff: null,
      selectedDate: null,
      selectedTimeSlot: null,
      note: '',
      totalDuration: 0,
      totalAmount: 0,
      currentStep: 1,
    });
  },

  canProceed: () => {
    const state = get();
    switch (state.currentStep) {
      case 1:
        return !!state.salon;
      case 2:
        return state.selectedServices.length > 0;
      case 3:
        // Staff is optional
        return true;
      case 4:
        return !!state.selectedDate && !!state.selectedTimeSlot;
      case 5:
        return true;
      default:
        return false;
    }
  },
}));
