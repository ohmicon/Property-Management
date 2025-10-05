import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { useCustomer } from "./customer-context";
import { useRouter } from "next/navigation";

type ApiCustomer = {
  id: string;
  memberId: string;
  fullName: string;
  citizenId: string;
  mobile: string;
  type: string;
};

export default function SelectCustomer() {
  const { setCustomer } = useCustomer();
  const router = useRouter();
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  // Search API
  async function handleSearch() {
    setLoading(true);
    const res = await fetch("/api/get-customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword }),
    });
    const data = await res.json();
    if (data.success) setCustomers(data.data);
    else setCustomers([]);
    setLoading(false);
  }

  function handleSelect(c: ApiCustomer) {
    setCustomer({
      id: c.id,
      memberId: c.memberId,
      name: c.fullName,
      citizenId: c.citizenId,
      mobile: c.mobile,
      type: c.type,
    });
    router.refresh(); // หรือ router.push("/property-layout") ถ้ามี route แยก
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-medium text-gray-800">ค้นหาชื่อลูกค้า</h2>
          <button className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search Inputs */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="เลขบัตรประชาชน/ชื่อ/เบอร์โทร"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 whitespace-nowrap"
              onClick={handleSearch}
              disabled={loading}
            >
              <Search size={20} />
              {loading ? "ค้นหา..." : "ค้นหา"}
            </button>
          </div>

          {/* Table */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Customer ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">เลขบัตรประชาชน</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">เบอร์โทร</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ประเภท</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {customers?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-red-500">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  customers?.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">{c.memberId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.citizenId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.mobile}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.type}</td>
                      <td>
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          onClick={() => handleSelect(c)}
                        >
                          เลือก
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Record */}
          <div className="flex justify-end mt-4 text-sm text-gray-600">
            Total Record : {customers?.length}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
          <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}