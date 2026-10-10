import {z} from 'zod';
export const stockAdjustmentSchema=z.object({
 newQuantity:z.coerce.number().finite().min(0,'A quantidade não pode ser negativa.'),
 reason:z.enum(['Perda','Avaria','Contagem','Doação','Outro'],{required_error:'O motivo é obrigatório.'}),
 notes:z.string().optional(),
});
export const receiveStockItemSchema=z.object({
 productId:z.string(),productName:z.string(),quantityOrdered:z.number(),quantityAlreadyReceived:z.number(),
 quantityReceived:z.coerce.number().finite().min(0,'Deve ser >= 0'),
 cost:z.coerce.number().finite().min(0,'Custo inválido'),
}).refine(data=>data.quantityReceived<=data.quantityOrdered-data.quantityAlreadyReceived,{message:'Não pode receber mais do que o pendente.',path:['quantityReceived']});
export function stockQuantityInput(value:string){return value.trim()===''?0:Number(value);}
