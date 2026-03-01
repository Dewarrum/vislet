"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CreateBankAccountInput = {
  name: string;
  currency: string;
};

type CreateBankAccountDialogProps = {
  onCreate: (input: CreateBankAccountInput) => Promise<void>;
};

export function CreateBankAccountDialog({ onCreate }: CreateBankAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    const trimmedName = name.trim();
    const normalizedCurrency = currency.trim().toUpperCase();

    if (!trimmedName) {
      setErrorMessage("Bank account name is required.");
      return;
    }

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setErrorMessage("Currency must be a 3-letter code, such as USD.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      await onCreate({
        currency: normalizedCurrency,
        name: trimmedName,
      });
      setName("");
      setCurrency("USD");
      setOpen(false);
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not create the bank account. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setErrorMessage(null);
        }
      }}
      open={open}
    >
      <Button render={<DialogTrigger />} variant="default">
        New account
      </Button>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create a bank account</DialogTitle>
          <DialogDescription>
            Add a new account by setting a name and currency.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-bank-account-name">Name</Label>
              <Input
                id="new-bank-account-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Primary checking"
                value={name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-bank-account-currency">Currency</Label>
              <Input
                id="new-bank-account-currency"
                maxLength={3}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                placeholder="USD"
                value={currency}
              />
            </div>
            {errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : null}
          </form>
        </DialogPanel>
        <DialogFooter variant="bare">
          <Button render={<DialogClose />} variant="outline">
            Cancel
          </Button>
          <Button disabled={isCreating} onClick={() => void submit()}>
            {isCreating ? "Creating..." : "Create account"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
