import React, { createContext, useContext, useState } from "react";

type Customer = {
  id: string;
  memberId: string;
  name: string;
  citizenId: string;
  mobile: string;
  type: string;
};

type CustomerContextType = {
  customer: Customer | null;
  setCustomer: (customer: Customer) => void;
};

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used within CustomerProvider");
  return context;
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  return (
    <CustomerContext.Provider value={{ customer, setCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
};