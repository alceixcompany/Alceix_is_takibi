import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-muted p-3 text-muted-foreground">
          <Inbox className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
