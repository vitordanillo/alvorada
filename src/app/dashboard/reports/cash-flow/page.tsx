
import { PageHeader } from "@/components/page-header";
import { CashFlowReportClient } from "@/components/reports/cash-flow-report";

export default function CashFlowReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatório de Fluxo de Caixa"
        description="Analise as entradas e saídas de caixa ao longo do tempo."
      />
      <CashFlowReportClient />
    </div>
  );
}
