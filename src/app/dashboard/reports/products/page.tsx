
import { PageHeader } from "@/components/page-header";
import { ProductsReportClient } from "@/components/reports/products-report";

export default function ProductsReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatório de Produtos"
        description="Acompanhe a performance e o status de estoque dos seus produtos."
      />
      <ProductsReportClient />
    </div>
  );
}
