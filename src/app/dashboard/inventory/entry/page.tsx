
import { PageHeader } from "@/components/page-header";
import { StockEntryClient } from "./entry-client";

export default function StockEntryPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Entrada de Estoque"
        description="Registre as mercadorias recebidas dos fornecedores para atualizar seu inventário."
      />
      <StockEntryClient />
    </div>
  );
}
