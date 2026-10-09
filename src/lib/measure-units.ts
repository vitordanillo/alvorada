export type Measurement={factor:number;baseUnit:'L'|'kg'|'un'};
export type MeasureUnit={label:string;measurement?:Measurement};
export const DEFAULT_MEASURE_UNITS:MeasureUnit[]=[
 {label:'un',measurement:{factor:1,baseUnit:'un'}},{label:'kg',measurement:{factor:1,baseUnit:'kg'}},{label:'g',measurement:{factor:0.001,baseUnit:'kg'}},{label:'L',measurement:{factor:1,baseUnit:'L'}},{label:'mL',measurement:{factor:0.001,baseUnit:'L'}},
 ...[200,250,300,350,500,600,1000,1500,2000,2500,3000].map(ml=>({label:ml>=1000?`${ml/1000} L`:`${ml} mL`,measurement:{factor:ml/1000,baseUnit:'L' as const}})),{label:'250 g',measurement:{factor:0.25,baseUnit:'kg'}},{label:'500 g',measurement:{factor:0.5,baseUnit:'kg'}},{label:'1 kg',measurement:{factor:1,baseUnit:'kg'}},{label:'Caixa'},{label:'Pacote'},{label:'Fardo'},{label:'Garrafa'},{label:'Lata'}];
export function validMeasurement(value:unknown):Measurement|null{if(value==null)return null;const m=value as Measurement;if(!m||!Number.isFinite(m.factor)||m.factor<=0||m.factor>1000000||!['L','kg','un'].includes(m.baseUnit))throw new Error('Conversão de unidade inválida.');return {factor:m.factor,baseUnit:m.baseUnit};}
