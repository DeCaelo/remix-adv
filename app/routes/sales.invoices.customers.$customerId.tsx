import type { LoaderFunctionArgs } from "@remix-run/node";
import { defer, json } from "@remix-run/node";
import {
  Await,
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useParams,
  useRouteError,
} from "@remix-run/react";
import { Suspense } from "react";
import invariant from "tiny-invariant";
import { ErrorFallback } from "~/components/ErrorFallback";
import { getCustomerInfo, getCustomerDetails } from "~/models/customer.server";
import { requireUser } from "~/session.server";
import { InvoiceDetailsFallback } from "~/styles";
import { currencyFormatter } from "~/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUser(request);
  const { customerId } = params;
  invariant(
    typeof customerId === "string",
    "params.customerId is not available",
  );
  // fast
  const customerInfo = await getCustomerInfo(customerId);
  // defer slow
  const customerDetailsPromise = getCustomerDetails(customerId);
  // 103 Early Hints: https://developer.mozilla.org/fr/docs/Web/HTTP/Status/103

  if (!customerInfo) {
    throw json({ type: "CustomError", message: "not found" }, { status: 404 });
  }

  return defer({
    customerInfo,
    customerDetails: customerDetailsPromise,
  });
}

const lineItemClassName = "border-t boder-theme-300 text-[14px] h-[56px]";

export default function CustomerRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="relative p-10">
      <div className="text-[length:14px] font-bold leading-6">
        {data.customerInfo.email}
      </div>
      <div className="text-[length:32px] font-bold leading-[40px]">
        {data.customerInfo.name}
      </div>
      <div className="h-4" />
      <div className="text-m-h3 font-bold leading-8">Invoices</div>
      <div className="h-4" />
      <Suspense fallback={<InvoiceDetailsFallback />}>
        <Await
          resolve={data.customerDetails}
          errorElement={<ErrorFallback>Something went wrong</ErrorFallback>}
        >
          {(customerDetails) => (
            <table className="w-full">
              <tbody>
                {customerDetails?.invoiceDetails.map((invoiceDetails) => (
                  <tr key={invoiceDetails.id} className={lineItemClassName}>
                    <td>
                      <Link
                        className="text-theme-600 underline"
                        to={`../../invoices/${invoiceDetails.id}`}
                      >
                        {invoiceDetails.number}
                      </Link>
                    </td>
                    <td
                      className={
                        "text-center uppercase" +
                        " " +
                        (invoiceDetails.dueStatus === "paid"
                          ? "text-green-brand"
                          : invoiceDetails.dueStatus === "overdue"
                          ? "text-red-brand"
                          : "")
                      }
                    >
                      {invoiceDetails.dueStatusDisplay}
                    </td>
                    <td className="text-right">
                      {currencyFormatter.format(invoiceDetails.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const params = useParams();

  if (isRouteErrorResponse(error)) {
    if (error.data.type === "CustomError") {
      return (
        <ErrorFallback>
          No post found with the slug: '{params.slug}'
        </ErrorFallback>
      );
    }
  }

  return <ErrorFallback>Something went wrong loading this post!</ErrorFallback>;
}
