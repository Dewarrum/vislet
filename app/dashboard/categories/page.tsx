"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import type { CreateCategoryInput } from "@/components/create-category-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function formatCreatedAt(createdAt: number) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt);
}

export default function CategoriesPage() {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const trimmedSearchText = debouncedSearchText.trim();
  const categories = useQuery(api.categories.listForCurrentUser, {
    searchText: trimmedSearchText.length > 0 ? trimmedSearchText : undefined,
  });
  const createCategory = useMutation(api.categories.create);
  const renameCategory = useMutation(api.categories.rename);
  const removeCategory = useMutation(api.categories.remove);

  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoryRows = useMemo(() => categories ?? [], [categories]);

  const onCreate = async (input: CreateCategoryInput) => {
    setErrorMessage(null);

    try {
      await createCategory(input);
    } catch {
      setErrorMessage("Could not create the category. Please try again.");
      throw new Error("Could not create the category. Please try again.");
    }
  };

  const onRename = async (categoryId: Id<"categories">, currentName: string) => {
    const draftName = draftNames[categoryId]?.trim();

    if (!draftName || draftName === currentName) {
      return;
    }

    setSavingId(categoryId);
    setErrorMessage(null);

    try {
      await renameCategory({
        categoryId,
        name: draftName,
      });
    } catch {
      setErrorMessage("Could not rename the category. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (categoryId: Id<"categories">, categoryName: string) => {
    const confirmed = window.confirm(
      `Delete the category "${categoryName}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(categoryId);
    setErrorMessage(null);

    try {
      await removeCategory({ categoryId });
      setDraftNames((previous) => {
        const next = { ...previous };
        delete next[categoryId];
        return next;
      });
    } catch {
      setErrorMessage("Could not delete the category. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Categories
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create and manage your expense categories.
          </p>
        </div>
        <CreateCategoryDialog onCreate={onCreate} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your categories</CardTitle>
          <CardDescription>
            Each category stores an id, editable name, and created timestamp.
          </CardDescription>
        </CardHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="category-search">Search</Label>
            <Input
              id="category-search"
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Find categories by name"
              value={searchText}
            />
          </div>

          {categories === undefined ? (
            <p className="text-sm text-slate-600">Loading categories...</p>
          ) : categoryRows.length === 0 ? (
            <p className="text-sm text-slate-600">
              {trimmedSearchText.length > 0
                ? "No categories match your search."
                : "No categories found yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created at</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryRows.map((category) => {
                  const draftName = draftNames[category._id] ?? category.name;
                  const isSaving = savingId === category._id;
                  const isDeleting = deletingId === category._id;
                  const canSave =
                    draftName.trim().length > 0 &&
                    draftName.trim() !== category.name &&
                    !isSaving &&
                    !isDeleting;

                  return (
                    <TableRow key={category._id}>
                      <TableCell className="w-[40%] min-w-[220px]">
                        <Input
                          aria-label={`Name for ${category._id}`}
                          onChange={(event) =>
                            setDraftNames((previous) => ({
                              ...previous,
                              [category._id]: event.target.value,
                            }))
                          }
                          value={draftName}
                        />
                      </TableCell>
                      <TableCell>{formatCreatedAt(category.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {category._id}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            disabled={!canSave}
                            onClick={() => onRename(category._id, category.name)}
                            size="sm"
                            variant="outline"
                          >
                            {isSaving ? "Saving..." : "Save name"}
                          </Button>
                          <Button
                            disabled={isDeleting || isSaving}
                            onClick={() => onDelete(category._id, category.name)}
                            size="sm"
                            variant="destructive-outline"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
