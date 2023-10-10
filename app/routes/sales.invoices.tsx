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
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Separator } from "~/components/ui/separator";

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
      <h1 className="font-display text-d-h3">Sales</h1>
      <div className="h-6" />
      <Tabs defaultValue="overview" className="w-[600px]">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <NavLink
              to="."
              className={linkClassName({ isActive: indexMatches })}
            >
              Overview
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <NavLink
              prefetch="intent"
              to="subscriptions"
              className={linkClassName}
            >
              Subscriptions
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <NavLink
              prefetch="intent"
              to={
                data.firstInvoiceId
                  ? `invoices/${data.firstInvoiceId}`
                  : "invoices"
              }
              className={linkClassName({ isActive: invoiceMatches })}
            >
              Invoices
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="customers">
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
          </TabsTrigger>
          <TabsTrigger value="deposits">
            <NavLink prefetch="intent" to="deposits" className={linkClassName}>
              Deposits
            </NavLink>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Separator className="my-4" />
      <div className="flex items-center justify-between gap-4">
        <InvoicesInfo label="Overdue" amount={data.overdueAmount} />
        <div className="flex h-4 flex-1 overflow-hidden rounded-full">
          <div className="bg-theme-700 flex-1" />
          <div
            className="bg-theme-400"
            style={{ width: `${dueSoonPercent}%` }}
          />
        </div>
        <InvoicesInfo label="Due Soon" amount={data.dueSoonAmount} right />
      </div>
      <Separator className="my-4" />
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
      <div className="text-[length:18px] text-theme-500">
        {currencyFormatter.format(amount)}
      </div>
    </div>
  );
}

function InvoiceList({ children }: { children: React.ReactNode }) {
  const { invoiceListItems } = useLoaderData<typeof loader>();
  return (
    <div className="flex overflow-hidden rounded-lg border ">
      <div className="w-1/2 border-r ">
        <NavLink
          to="new"
          prefetch="intent"
          className={({ isActive }) =>
            "block border  py-3 px-4 hover:bg-theme-50" +
            " " +
            (isActive ? "bg-theme-50" : "")
          }
        >
          <span className="flex gap-1">
            <FolderPlus /> <span>Create new invoice</span>
          </span>
        </NavLink>
        <ScrollArea className="h-80 w-full rounded-md border">
          {invoiceListItems.map((invoice) => (
            <NavLink
              key={invoice.id}
              to={invoice.id}
              prefetch="intent"
              className={({ isActive }) =>
                "block border-b py-3 px-4 hover:bg-theme-50" +
                " " +
                (isActive ? "bg-theme-50" : "")
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
                      ? "text-theme-300"
                      : invoice.dueStatus === "overdue"
                      ? "text-theme-700"
                      : "")
                  }
                >
                  {invoice.dueStatusDisplay}
                </div>
              </div>
            </NavLink>
          ))}
        </ScrollArea>
      </div>
      <div className="w-1/2">{children}</div>
    </div>
  );
}
