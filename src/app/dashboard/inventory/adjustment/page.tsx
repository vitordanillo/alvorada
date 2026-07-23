
import { PageHeader } from "@/components/page-header";
import { StockAdjustmentClient } from "./adjustment-client";

export default function StockAdjustmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ajuste Manual de Estoque"
        description="Corrija a quantidade em estoque de um produto devido a perdas, avarias ou contagens de inventário."
      />
      <StockAdjustmentClient />
    </div>
  );
}
