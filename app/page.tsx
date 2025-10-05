"use client"

import PropertyLayout from "./property-layout"
import { CustomerProvider, useCustomer } from "./customer-context"
import SelectCustomer from "./select-customer"

function MainPage() {
  const { customer } = useCustomer();
  return customer ? <PropertyLayout /> : <SelectCustomer />;
}

export default function SyntheticV0PageForDeployment() {
  return (
    <CustomerProvider>
      <MainPage />
    </CustomerProvider>
  );
}
