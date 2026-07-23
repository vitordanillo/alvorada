import { PageHeader } from "@/components/page-header";
import { SuggestionClient } from "./suggestion-client";

export default function RestockPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sugestão de Reposição com IA"
        description="Analise seus dados de vendas e estoque para obter sugestões inteligentes de reposição."
      />
      <SuggestionClient />
    </div>
  );
}
