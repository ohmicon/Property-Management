"use client"

import PropertyLayout from "./property-layout/page"
import { useCustomerStore } from "./customer-store"
import SelectCustomer from "./select-customer"

function MainPage() {
  const customer = useCustomerStore((state) => state.customer);
  return customer ? <PropertyLayout /> : <SelectCustomer />;
}

export default function HomePage() {
  return <MainPage />;
}
