
import { PageHeader } from "@/components/page-header";
import { AccountsPayableClient } from "./payable-client";

export default function AccountsPayablePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contas a Pagar"
        description="Gerencie suas despesas, boletos de fornecedores e outras contas."
      />
      <AccountsPayableClient />
    </div>
  );
}
