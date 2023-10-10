import { Outlet, useMatches } from "@remix-run/react";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, NavLink } from "@remix-run/react";
import { getFirstInvoice, getInvoiceListItems } from "~/models/invoice.server";
import { currencyFormatter } from "~/utils";
import { requireUser } from "~/session.server";
import { Label } from "~/components/ui/label";
import { FolderPlus } from "lucide-react";
import { getFirstCustomer } from "~/models/customer.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const invoiceListItems = await getInvoiceListItems();
  const [firstInvoice, firstCustomer] = await Promise.all([
    getFirstInvoice(),
    getFirstCustomer(),
  ]);

  const dueSoonAmount = invoiceListItems.reduce((sum, li) => {
    if (li.dueStatus !== "due") {
      return sum;
    }
    const remainingBalance = li.totalAmount - li.totalDeposits;
    return sum + remainingBalance;
  }, 0);

  const overdueAmount = invoiceListItems.reduce((sum, li) => {
    if (li.dueStatus !== "overdue") {
      return sum;
    }
    const remainingBalance = li.totalAmount - li.totalDeposits;
    return sum + remainingBalance;
  }, 0);

  return json({
    invoiceListItems,
    overdueAmount,
    dueSoonAmount,
    firstInvoiceId: firstInvoice?.id,
    firstCustomerId: firstCustomer?.id,
  });
}

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? "font-bold text-black" : "";

export default function InvoicesRoute() {
  const data = useLoaderData<typeof loader>();
  const hundo = data.dueSoonAmount + data.overdueAmount;
  const dueSoonPercent = Math.floor((data.dueSoonAmount / hundo) * 100);
  const matches = useMatches();
  const indexMatches = matches.some((m) => m.id === "routes/sales/index");
  const invoiceMatches = matches.some((m) => m.id === "routes/sales/invoices");
  const customerMatches = matches.some(
    (m) => m.id === "routes/sales/customers",
  );

  return (
    <div className="relative">
      <h1 className="font-display text-d-h3 text-black">Sales</h1>
      <div className="h-6" />
      <div className="flex gap-4 border-b border-gray-100 pb-4 text-[length:14px] font-medium text-gray-400">
        <NavLink to="." className={linkClassName({ isActive: indexMatches })}>
          Overview
        </NavLink>
        <NavLink prefetch="intent" to="subscriptions" className={linkClassName}>
          Subscriptions
        </NavLink>
        <NavLink
          prefetch="intent"
          to={
            data.firstInvoiceId ? `invoices/${data.firstInvoiceId}` : "invoices"
          }
          className={linkClassName({ isActive: invoiceMatches })}
        >
          Invoices
        </NavLink>
        <NavLink
          prefetch="intent"
          to={
            data.firstCustomerId
              ? `customers/${data.firstCustomerId}`
              : "Customers"
          }
          className={linkClassName({ isActive: customerMatches })}
        >
          Customers
        </NavLink>
        <NavLink prefetch="intent" to="deposits" className={linkClassName}>
          Deposits
        </NavLink>
      </div>
      <div className="flex items-center justify-between gap-4">
        <InvoicesInfo label="Overdue" amount={data.overdueAmount} />
        <div className="flex h-4 flex-1 overflow-hidden rounded-full">
          <div className="bg-yellow-brand flex-1" />
          <div
            className="bg-green-brand"
            style={{ width: `${dueSoonPercent}%` }}
          />
        </div>
        <InvoicesInfo label="Due Soon" amount={data.dueSoonAmount} right />
      </div>
      <div className="h-4" />
      <Label>Invoice List</Label>
      <div className="h-2" />
      <InvoiceList>
        <Outlet />
      </InvoiceList>
    </div>
  );
}

function InvoicesInfo({
  label,
  amount,
  right,
}: {
  label: string;
  amount: number;
  right?: boolean;
}) {
  return (
    <div className={right ? "text-right" : ""}>
      <Label>{label}</Label>
      <div className="text-[length:18px] text-black">
        {currencyFormatter.format(amount)}
      </div>
    </div>
  );
}

function InvoiceList({ children }: { children: React.ReactNode }) {
  const { invoiceListItems } = useLoaderData<typeof loader>();
  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-100">
      <div className="w-1/2 border-r border-gray-100">
        <NavLink
          to="new"
          prefetch="intent"
          className={({ isActive }) =>
            "block border-b-4 border-gray-100 py-3 px-4 hover:bg-gray-50" +
            " " +
            (isActive ? "bg-gray-50" : "")
          }
        >
          <span className="flex gap-1">
            <FolderPlus /> <span>Create new invoice</span>
          </span>
        </NavLink>
        <div className="max-h-96 overflow-y-scroll">
          {invoiceListItems.map((invoice) => (
            <NavLink
              key={invoice.id}
              to={invoice.id}
              prefetch="intent"
              className={({ isActive }) =>
                "block border-b border-gray-50 py-3 px-4 hover:bg-gray-50" +
                " " +
                (isActive ? "bg-gray-50" : "")
              }
            >
              <div className="flex justify-between text-[length:14px] font-bold leading-6">
                <div>{invoice.name}</div>
                <div>{currencyFormatter.format(invoice.totalAmount)}</div>
              </div>
              <div className="flex justify-between text-[length:12px] font-medium leading-4 text-gray-400">
                <div>{invoice.number}</div>
                <div
                  className={
                    "uppercase" +
                    " " +
                    (invoice.dueStatus === "paid"
                      ? "text-green-brand"
                      : invoice.dueStatus === "overdue"
                      ? "text-red-brand"
                      : "")
                  }
                >
                  {invoice.dueStatusDisplay}
                </div>
              </div>
            </NavLink>
          ))}
        </div>
      </div>
      <div className="w-1/2">{children}</div>
    </div>
  );
}
