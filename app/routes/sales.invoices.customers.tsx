import {
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useSpinDelay } from "spin-delay";

import { requireUser } from "~/session.server";
import { getCustomerListItems } from "~/models/customer.server";
import { PlusSquare } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";

type LoadingCustomer = Awaited<ReturnType<typeof getCustomerListItems>>[number];

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  return json({
    customers: await getCustomerListItems(),
  });
}

export default function Customers() {
  const { customers } = useLoaderData<typeof loader>();
  const navigate = useNavigation();

  let loadingCustomer: LoadingCustomer | undefined;

  if (navigate.location?.state) {
    loadingCustomer = (navigate.location?.state as any)?.customer;
  }

  const showSkeleton = useSpinDelay(Boolean(loadingCustomer), {
    delay: 200,
    minDuration: 300,
  });

  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-100">
      <div className="w-1/2 border-r border-gray-100">
        <NavLink
          to="new"
          prefetch="intent"
          className={({ isActive }) =>
            "block border-b-4 border-theme-100 py-3 px-4 hover:bg-theme-50" +
            " " +
            (isActive ? "bg-theme-50" : "")
          }
        >
          <span className="flex gap-1">
            <PlusSquare /> <span>Create new customer</span>
          </span>
        </NavLink>
        <ScrollArea className="max-h-96">
          {customers.map((customer) => (
            <NavLink
              key={customer.id}
              to={customer.id}
              state={{ customer }}
              prefetch="intent"
              className={({ isActive }) =>
                "block border-b border-theme-50 py-3 px-4 hover:bg-theme-50" +
                " " +
                (isActive ? "bg-theme-50" : "")
              }
            >
              <div className="flex justify-between text-[length:14px] font-bold leading-6">
                <div>{customer.name}</div>
              </div>
              <div className="flex justify-between text-[length:12px] font-medium leading-4 text-theme-400">
                <div>{customer.email}</div>
              </div>
            </NavLink>
          ))}
        </ScrollArea>
      </div>
      <div className="flex w-1/2 flex-col justify-between">
        {loadingCustomer && showSkeleton ? (
          <CustomerSkeleton
            name={loadingCustomer.name}
            email={loadingCustomer.email}
          />
        ) : (
          <Outlet />
        )}
        <small className="p-2 text-center">
          Note: this is arbitrarily slow to demonstrate pending UI.
        </small>
      </div>
    </div>
  );
}

function CustomerSkeleton({ name, email }: { name: string; email: string }) {
  return (
    <div className="relative p-10">
      <div className="text-[length:14px] font-bold leading-6">{email}</div>
      <div className="text-[length:32px] font-bold leading-[40px]">{name}</div>
      <div className="h-4" />
      <div className="text-m-h3 font-bold leading-8">Invoices</div>
      <div className="h-4" />
      <div>
        <div className="flex h-[56px] items-center border-t border-theme-100">
          <div className="h-[14px] w-full animate-pulse rounded bg-theme-300">
            &nbsp;
          </div>
        </div>
        <div className="flex h-[56px] items-center border-t border-theme-100">
          <div className="h-[14px] w-full animate-pulse rounded bg-theme-300">
            &nbsp;
          </div>
        </div>
      </div>
    </div>
  );
}
