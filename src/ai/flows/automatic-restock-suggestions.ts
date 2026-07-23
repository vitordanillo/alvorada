
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating automatic restock suggestions.
 *
 * The flow analyzes sales data and stock levels to suggest optimal restock quantities.
 * It exports the following:
 * - `suggestRestock` - A function that triggers the restock suggestion flow.
 * - `SuggestRestockInput` - The input type for the suggestRestock function.
 * - `SuggestRestockOutput` - The return type for the suggestRestock function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the restock suggestion flow
const SuggestRestockInputSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().describe('Unique identifier for the product.'),
      productName: z.string().describe('Name of the product.'),
      salesData: z
        .array(
          z.object({
            date: z.string().describe('Date of the sale (YYYY-MM-DD).'),
            quantitySold: z
              .number()
              .describe('Quantity of the product sold on that date.'),
          })
        )
        .describe('Sales data for the product.'),
      currentStock: z.number().describe('Current stock level of the product.'),
      minimumStock: z
        .number()
        .describe('Minimum acceptable stock level of the product.'),
      unit: z.string().describe('Unit of measure for the product (e.g., kg, unit).'),
    })
  ).describe('Array of product details including sales data and stock levels.'),
});

export type SuggestRestockInput = z.infer<typeof SuggestRestockInputSchema>;

// Define the output schema for the restock suggestion flow
const SuggestRestockOutputSchema = z.object({
  restockSuggestions: z.array(
    z.object({
      productId: z.string().describe('The ID of the product to restock.'),
      productName: z.string().describe('The name of the product to restock.'),
      quantityToRestock: z
        .number()
        .describe('The suggested quantity to restock.'),
      reasoning: z
        .string()
        .describe('The reasoning behind the restock suggestion.'),
      unit: z
        .string()
        .describe('Unit of measure for the product (e.g., kg, unit).'),
    })
  ).describe('Array of restock suggestions for each product.'),
});

export type SuggestRestockOutput = z.infer<typeof SuggestRestockOutputSchema>;

// Define the prompt for generating restock suggestions
const restockPrompt = ai.definePrompt({
  name: 'restockPrompt',
  input: {schema: SuggestRestockInputSchema},
  output: {schema: SuggestRestockOutputSchema},
  prompt: `Você é um especialista em gestão de inventário para um minimercado. Analise os dados de vendas e os níveis de estoque atuais de cada produto para determinar as quantidades ideais de reposição. Sua resposta deve ser inteiramente em português do Brasil.

  Para cada produto, considere o seguinte:
  - Tendências de vendas ao longo do tempo (crescente, decrescente, estável)
  - Nível de estoque atual comparado ao nível de estoque mínimo
  - Quaisquer eventos futuros ou promoções que possam afetar a demanda

  Forneça uma sugestão de reposição para cada produto, incluindo a quantidade a ser reposta e uma breve explicação (em português) do seu raciocínio.

  Aqui estão os dados dos produtos:
  {{#each products}}
  Produto ID: {{{productId}}}
  Nome do Produto: {{{productName}}}
  Dados de Vendas:
  {{#each salesData}}
  - Data: {{{date}}}, Quantidade Vendida: {{{quantitySold}}}
  {{/each}}
  Estoque Atual: {{{currentStock}}} {{{unit}}}
  Estoque Mínimo: {{{minimumStock}}} {{{unit}}}

  {{/each}}

  Formate sua resposta como um objeto JSON com um array 'restockSuggestions'. Cada objeto no array deve incluir 'productId', 'productName', 'quantityToRestock', 'reasoning', e 'unit'.
  `,
});

// Define the Genkit flow for generating restock suggestions
const suggestRestockFlow = ai.defineFlow(
  {
    name: 'suggestRestockFlow',
    inputSchema: SuggestRestockInputSchema,
    outputSchema: SuggestRestockOutputSchema,
  },
  async input => {
    const {output} = await restockPrompt(input);
    return output!;
  }
);

// Exported function to trigger the restock suggestion flow
export async function suggestRestock(input: SuggestRestockInput): Promise<SuggestRestockOutput> {
  return suggestRestockFlow(input);
}
