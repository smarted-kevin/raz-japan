"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { api } from "../../../../../../convex/_generated/api";
import type { Doc } from "../../../../../../convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export default function OrganizationTable({
  organizations,
}: {
  organizations: Doc<"organization">[];
}) {
  const t = useTranslations("dashboard.admin.organizations");
  const tc = useTranslations("dashboard.admin.common");
  const router = useRouter();
  const createOrganization = useMutation(
    api.mutations.organization.createOrganization,
  );
  const editOrganization = useMutation(
    api.mutations.organization.editOrganization,
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doc<"organization">>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<"created" | "updated">();
  const form = useForm<{ name: string; status: "active" | "inactive" }>({
    defaultValues: { name: "", status: "active" },
  });

  function onOpenChange(value: boolean) {
    if (form.formState.isSubmitting) return;
    setOpen(value);
    setError(undefined);
    if (value) {
      setSuccess(undefined);
      setEditing(undefined);
    }
    form.reset({ name: "", status: "active" });
  }

  function openEdit(organization: Doc<"organization">) {
    setEditing(organization);
    form.reset({
      name: organization.organization_name,
      status: organization.status,
    });
    setError(undefined);
    setSuccess(undefined);
    setOpen(true);
  }

  async function onSubmit({
    name,
    status,
  }: {
    name: string;
    status: "active" | "inactive";
  }) {
    setError(undefined);
    setSuccess(undefined);
    try {
      if (editing) {
        await editOrganization({
          id: editing._id,
          org_name: name.trim(),
          status,
        });
      } else {
        await createOrganization({ name: name.trim() });
      }
      form.reset();
      setOpen(false);
      setSuccess(editing ? "updated" : "created");
      router.refresh();
    } catch (caught) {
      const data: unknown =
        caught instanceof ConvexError ? caught.data : undefined;
      const code =
        data && typeof data === "object" && "code" in data
          ? data.code
          : undefined;
      setError(
        code === "DUPLICATE_NAME"
          ? t("duplicate_name")
          : code === "NAME_REQUIRED"
            ? t("name_required")
            : code === "NOT_FOUND"
              ? t("not_found")
              : tc("error_generic"),
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button>{t("add_organization")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="font-bold">
              {editing ? t("edit_organization") : t("add_new_organization")}
            </DialogTitle>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                {error && (
                  <p role="alert" className="text-destructive">
                    {error}
                  </p>
                )}
                <FormField
                  control={form.control}
                  name="name"
                  rules={{
                    validate: (value) => !!value.trim() || t("name_required"),
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("organization_name")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {editing && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tc("status")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={form.formState.isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">
                              {tc("active")}
                            </SelectItem>
                            <SelectItem value="inactive">
                              {tc("inactive")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? tc("saving")
                    : editing
                      ? tc("save_changes")
                      : tc("submit")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {success && <p role="status">{t(success)}</p>}
      {organizations.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("organization_name")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead>{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org._id}>
                <TableCell>{org.organization_name}</TableCell>
                <TableCell>
                  {tc(org.status === "active" ? "active" : "inactive")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => openEdit(org)}
                    aria-label={t("edit_named_organization", {
                      name: org.organization_name,
                    })}
                  >
                    {t("edit")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
