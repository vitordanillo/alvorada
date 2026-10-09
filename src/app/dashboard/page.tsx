'use client';
import {useAppContext} from '@/context/app-context';
import {PageHeader} from '@/components/page-header';
import {BusinessReport} from '@/components/reports/business-report';
export default function DashboardPage(){const {user,activeSession}=useAppContext();if(user&&!['Administrador','Gerente'].includes(user.role))return <div className="space-y-4"><PageHeader title="Minha loja" description={user.store?.name??'Operação'}/><p>Caixa: {activeSession?'Aberto':'Fechado'}</p><a className="underline" href={user.role==='Estoquista'?'/dashboard/inventory':'/pos'}>{user.role==='Estoquista'?'Abrir estoque':'Abrir PDV'}</a></div>;return <div className="space-y-6"><PageHeader title="Visão geral" description="Indicadores da loja e comparação por período"/><BusinessReport view="dashboard"/></div>;}
