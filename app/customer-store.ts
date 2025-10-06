import { create } from "zustand";

type Customer = {
  id: string;
  memberId: string;
  name: string;
  citizenId: string;
  mobile: string;
  type: string;
}

type CustomerState = {
  customer: Customer | null;
  setCustomer: (customer: Customer) => void;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  customer: null,
  setCustomer: (customer) => set({ customer }),
}));