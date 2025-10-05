import { create } from "zustand";

type CustomerState = {
  customer: any;
  setCustomer: (customer: any) => void;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  customer: null,
  setCustomer: (customer) => set({ customer }),
}));