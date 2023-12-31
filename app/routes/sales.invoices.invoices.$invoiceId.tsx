import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useLocation,
  useParams,
  useRouteError,
} from "@remix-run/react";
import { getInvoiceDetails } from "~/models/invoice.server";
import { requireUser } from "~/session.server";
import { currencyFormatter, parseDate } from "~/utils";
import { createDeposit } from "~/models/deposit.server";
import invariant from "tiny-invariant";
import { ErrorFallback } from "~/components/ErrorFallback";
import { Label } from "~/components/ui/label";
import { inputClasses } from "~/styles";
import { Button } from "~/components/ui/button";
import { useEffect, useRef } from "react";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { CalendarCheck, Zap } from "lucide-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUser(request);
  const { invoiceId } = params;
  if (typeof invoiceId !== "string") {
    throw new Error("This should be impossible.");
  }
  const invoiceDetails = await getInvoiceDetails(invoiceId);
  if (!invoiceDetails) {
    throw json({ type: "CustomError", message: "not found" }, { status: 404 });
  }
  return json({
    customerName: invoiceDetails.invoice.customer.name,
    customerId: invoiceDetails.invoice.customer.id,
    totalAmount: invoiceDetails.totalAmount,
    dueStatus: invoiceDetails.dueStatus,
    dueDisplay: invoiceDetails.dueStatusDisplay,
    invoiceDateDisplay: invoiceDetails.invoice.invoiceDate.toLocaleDateString(),
    lineItems: invoiceDetails.invoice.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
    })),
    deposits: invoiceDetails.invoice.deposits.map((deposit) => ({
      id: deposit.id,
      amount: deposit.amount,
      depositDateFormatted: deposit.depositDate.toLocaleDateString(),
    })),
  });
}

function validateAmount(amount: number) {
  if (amount <= 0) return "Must be greater than 0";
  if (Number(amount.toFixed(2)) !== amount) {
    return "Must only have two decimal places";
  }
  return null;
}

function validateDepositDate(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return "Please enter a valid date";
  }
  return null;
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUser(request);
  const { invoiceId } = params;
  if (typeof invoiceId !== "string") {
    throw new Error("This should be impossible.");
  }
  const formData = await request.formData();
  const intent = formData.get("intent");
  invariant(typeof intent === "string", "intent required");
  switch (intent) {
    case "create-deposit": {
      const amount = Number(formData.get("amount"));
      const depositDateString = formData.get("depositDate");
      const note = formData.get("note");
      invariant(!Number.isNaN(amount), "amount must be a number");
      invariant(typeof depositDateString === "string", "dueDate is required");
      invariant(typeof note === "string", "dueDate is required");
      const depositDate = parseDate(depositDateString);

      const errors = {
        amount: validateAmount(amount),
        depositDate: validateDepositDate(depositDate),
      };
      const hasErrors = Object.values(errors).some(
        (errorMessage) => errorMessage,
      );
      if (hasErrors) {
        return json({ errors });
      }

      await createDeposit({ invoiceId, amount, note, depositDate });
      return new Response("ok");
    }
    default: {
      throw new Error(`Unsupported intent: ${intent}`);
    }
  }
}

const lineItemClassName =
  "flex justify-between border-t boder-theme-300 py-4 text-[14px] leading-[24px]";

export default function InvoiceRoute() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  return (
    <div className="relative p-10" key={location.key}>
      <Link
        to={`../../customers/${data.customerId}`}
        className="text-[length:14px] font-bold leading-6 underline"
      >
        {data.customerName}
      </Link>
      <div className="text-[length:32px] font-bold leading-[40px] mb-3">
        {currencyFormatter.format(data.totalAmount)}
      </div>
      <Label>
        <span
          className={
            data.dueStatus === "paid"
              ? "text-green-brand"
              : data.dueStatus === "overdue"
              ? "text-red-brand"
              : ""
          }
        >
          <Badge
            variant={data.dueStatus === "paid" ? "secondary" : "destructive"}
          >
            <Zap size="16" className="mr-1" /> {data.dueDisplay.toUpperCase()}
          </Badge>
        </span>
        <Badge variant="secondary" className="ml-2">
          <CalendarCheck size="16" className="mr-1" />
          {`INVOICED ${data.invoiceDateDisplay}`}
        </Badge>
      </Label>
      <div className="h-4" />
      {data.lineItems.map((item) => (
        <LineItemDisplay
          key={item.id}
          description={item.description}
          unitPrice={item.unitPrice}
          quantity={item.quantity}
        />
      ))}
      <div className={`${lineItemClassName} font-bold`}>
        <div>Net Total</div>
        <div>{currencyFormatter.format(data.totalAmount)}</div>
      </div>
      <div className="h-8" />
      <Deposits />
    </div>
  );
}

function Deposits() {
  const data = useLoaderData<typeof loader>();
  const formRef = useRef<HTMLFormElement>(null);
  const newDepositFetcher = useFetcher();
  const deposits = [...data.deposits];
  const submitting = newDepositFetcher.state === "submitting";
  if (submitting) {
    const formAmount = Number(newDepositFetcher.formData?.get("amount"));
    const formDepositDate = newDepositFetcher.formData?.get("depositDate");

    if (typeof formAmount === "number" && typeof formDepositDate === "string") {
      deposits.push({
        id: "new",
        amount: formAmount,
        depositDateFormatted: parseDate(formDepositDate).toLocaleDateString(),
      });
    }
  }

  const errors = (
    newDepositFetcher.data as unknown as {
      errors?: { amount: string; depositDate: string };
    }
  )?.errors;

  useEffect(() => {
    if (!formRef.current) return;
    if (newDepositFetcher.state !== "idle") return;

    const formEl = formRef.current;

    if (errors?.amount) {
      (formEl.elements as any).amount?.focus();
    } else if (errors?.depositDate) {
      (formEl.elements as any).depositDate?.focus();
    } else {
      (formEl.elements as any).amount?.focus();
      formEl.reset();
    }
  }, [newDepositFetcher.state, errors]);

  return (
    <div>
      <div className="font-bold leading-8">Deposits</div>
      {deposits.length > 0 ? (
        deposits.map((deposit) => (
          <div key={deposit.id} className={lineItemClassName}>
            <Link
              to={`/sales/invoices/deposits/${deposit.id}`}
              className=" underline"
            >
              {deposit.depositDateFormatted}
            </Link>
            <div>{currencyFormatter.format(deposit.amount)}</div>
          </div>
        ))
      ) : (
        <div>None yet</div>
      )}

      <newDepositFetcher.Form
        method="post"
        className="grid grid-cols-1 gap-x-4 gap-y-2 lg:grid-cols-2"
        ref={formRef}
        noValidate
      >
        <div className="min-w-[100px]">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="depositAmount">Amount</Label>
            {errors?.amount ? (
              <em id="amount-error" className="text-d-p-xs text-red-600">
                {errors.amount}
              </em>
            ) : null}

            <Input
              id="depositAmount"
              name="amount"
              type="number"
              className={inputClasses}
              min="0.01"
              step="any"
              required
              aria-invalid={Boolean(errors?.amount) || undefined}
              aria-errormessage={errors?.amount ? "amount-error" : undefined}
            />
          </div>
        </div>
        <div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="depositDate">Date</Label>
            {errors?.depositDate ? (
              <em id="depositDate-error" className="text-d-p-xs text-red-600">
                {errors.depositDate}
              </em>
            ) : null}

            <Input
              id="depositDate"
              name="depositDate"
              type="date"
              className={`${inputClasses} h-[34px]`}
              required
              aria-invalid={Boolean(errors?.depositDate) || undefined}
              aria-errormessage={
                errors?.depositDate ? "depositDate-error" : undefined
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:col-span-2 lg:flex">
          <div className="flex-1">
            <Label htmlFor="depositNote">Note</Label>
            <Input
              id="depositNote"
              name="note"
              type="text"
              className={inputClasses}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              name="intent"
              value="create-deposit"
              disabled={submitting}
              variant="secondary"
            >
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </newDepositFetcher.Form>
    </div>
  );
}

function LineItemDisplay({
  description,
  quantity,
  unitPrice,
}: {
  description: string;
  quantity: number;
  unitPrice: number;
}) {
  return (
    <div className={lineItemClassName}>
      <div>{description}</div>
      {quantity === 1 ? null : <div className="text-[10px]">({quantity}x)</div>}
      <div>{currencyFormatter.format(unitPrice)}</div>
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
          No invoice found with the ID of "{params.invoiceId}"
        </ErrorFallback>
      );
    }
  }

  return (
    <div className="absolute inset-0 flex justify-center bg-red-100 pt-4">
      <div className="text-red-brand text-center">
        <div className="text-[14px] font-bold">Oh snap!</div>
        <div className="px-2 text-[12px]">There was a problem. Sorry.</div>
      </div>
    </div>
  );
}
