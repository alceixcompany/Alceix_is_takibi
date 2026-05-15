"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { closeSaleAction } from "@/lib/actions/sales";
import { PRODUCT_OPTIONS } from "@/lib/constants";
import type { AppUser, Firm } from "@/lib/types";

export function SaleCloseForm({
  firms,
  salesUsers,
  currentUserId,
  isAdmin,
}: {
  firms: Firm[];
  salesUsers: AppUser[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [state, action] = useActionState(closeSaleAction, {});
  const [product, setProduct] = useState(PRODUCT_OPTIONS[0]?.value ?? "website");
  const [amount, setAmount] = useState(String(PRODUCT_OPTIONS[0]?.price ?? 3000));

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="firm_id">Firma</Label>
        <Select id="firm_id" name="firm_id" defaultValue={firms[0]?.id}>
          {firms.map((firm) => (
            <option key={firm.id} value={firm.id}>
              {firm.company_name}
            </option>
          ))}
        </Select>
      </div>

      {isAdmin ? (
        <div className="space-y-2">
          <Label htmlFor="user_id">Satış sahibi</Label>
          <Select id="user_id" name="user_id" defaultValue={currentUserId}>
            {salesUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <input type="hidden" name="user_id" value={currentUserId} />
      )}

      <div className="space-y-2">
        <Label htmlFor="product_type">Ürün</Label>
        <Select
          id="product_type"
          name="product_type"
          value={product}
          onChange={(event) => {
            const nextProduct = PRODUCT_OPTIONS.find((item) => item.value === event.target.value);
            setProduct(event.target.value as typeof product);
            setAmount(String(nextProduct?.price ?? amount));
          }}
        >
          {PRODUCT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Tutar</Label>
        <Input
          id="amount"
          name="amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="payment_status">Ödeme durumu</Label>
        <Select id="payment_status" name="payment_status" defaultValue="pending">
          <option value="pending">Ödeme bekleniyor</option>
          <option value="paid">Ödeme alındı</option>
        </Select>
      </div>

      <div className="space-y-3 lg:col-span-2">
        <FormMessage error={state.error} success={state.success} />
        <SubmitButton>Satışı Kaydet</SubmitButton>
      </div>
    </form>
  );
}
