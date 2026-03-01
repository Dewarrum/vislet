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

export type CreateCategoryInput = {
  name: string;
};

type CreateCategoryDialogProps = {
  onCreate: (input: CreateCategoryInput) => Promise<void>;
};

export function CreateCategoryDialog({
  onCreate,
}: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage("Category name is required.");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      await onCreate({ name: trimmedName });
      setName("");
      setOpen(false);
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not create the category. Please try again.");
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
        New category
      </Button>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create a category</DialogTitle>
          <DialogDescription>Add a new category by name.</DialogDescription>
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
              <Label htmlFor="new-category-name">Name</Label>
              <Input
                id="new-category-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Groceries"
                value={name}
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
            {isCreating ? "Creating..." : "Create category"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
