
import { PageHeader } from "@/components/page-header";
import { SalesReportClient } from "@/components/reports/sales-report";

export default function SalesReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatório de Vendas"
        description="Analise o desempenho de vendas por período."
      />
      <SalesReportClient />
    </div>
  );
}
