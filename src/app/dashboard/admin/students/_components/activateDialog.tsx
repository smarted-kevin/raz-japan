"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export function ActivateDialog({ id }: { id: string }) {
  const t = useTranslations("dashboard.admin.students");
  const tc = useTranslations("dashboard.admin.common");

  const today = new Date();
  const [start_date, setDate] = React.useState<Date>();

  return (
    <Dialog>
      <DialogTrigger
        title={t("activate_student")}
        className="text-xs text-blue-600 p-1"
      >
        {t("activate")}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="pb-4">{t("activate_instructions")}</DialogTitle>
        <form className="flex flex-col">
          <div className="flex flex-col gap-y-4 w-3/4 mb-6">
            <div className="flex gap-x-4 items-center">
              <Label htmlFor="email">{tc("email")}</Label>
              <Input type="email" name="email" id="email" required />
            </div>
            <div className="flex gap-x-4 items-center">
              <Label htmlFor="start_date">{tc("expiry_date")}</Label>
              <input
                type="hidden"
                id="start_date"
                name="start_date"
                value={start_date?.toISOString()}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    name="start_date"
                    id="start_date"
                    variant={"outline"}
                    className="w-[280px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {start_date ? (
                      format(start_date, "yyyy-MM-dd")
                    ) : (
                      <span>{tc("pick_date")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" side="bottom">
                  <Calendar
                    mode="single"
                    selected={start_date}
                    onSelect={setDate}
                    disabled={(date) => date < today}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button type="submit" className="w-80 mx-auto">
            {tc("submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
