'use server';
import {z} from 'zod';
import {prisma,withTransaction} from './db';
import {withAuthenticatedAction,verifyUserRole,getAuthenticatedUser} from './auth';
import {DEFAULT_MEASURE_UNITS,validMeasurement,type MeasureUnit} from './measure-units';
export async function getMeasureUnitsAction(storeId:string){return withAuthenticatedAction(async()=>{const user=await getAuthenticatedUser();if(user.storeId!==storeId)throw new Error('Loja alterada.');const record=await prisma.systemConfig.findUnique({where:{key:'measure_units:'+storeId}});return [...DEFAULT_MEASURE_UNITS,...(Array.isArray(record?.value)?record.value as unknown as MeasureUnit[]:[])];});}
export async function createMeasureUnitAction(storeId:string,label:string,measurement?:unknown){return withAuthenticatedAction(async()=>{
 const user=await verifyUserRole(['Administrador','Gerente','Estoquista']);if(user.storeId!==storeId)throw new Error('Loja alterada.');const name=z.string().trim().min(1).max(40).parse(label);const m=validMeasurement(measurement);return withTransaction(async tx=>{
 const key='measure_units:'+storeId,record=await tx.systemConfig.findUnique({where:{key}}),custom=Array.isArray(record?.value)?record.value as unknown as MeasureUnit[]:[];
 if(custom.length>=200)throw new Error('Limite de 200 unidades personalizadas atingido.');if([...DEFAULT_MEASURE_UNITS,...custom].some(u=>u.label.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')))throw new Error('Esta unidade já está cadastrada.');
 const units=[...custom,{label:name,...(m?{measurement:m}:{})}];await tx.systemConfig.upsert({where:{key},create:{key,storeId,value:units},update:{value:units}});await tx.auditLog.create({data:{storeId,userUid:user.uid,userName:user.name,action:'Criar unidade de medida',details:JSON.stringify({label:name,measurement:m})}});return [...DEFAULT_MEASURE_UNITS,...units];
 });
});}
