import { Type } from "@google/genai";
import { ai } from "./geminiClient";
import type { AnalysisResult, RankingCategory, Recipe, CalorieCalculationResult, FavoriteFood, NewRankingItem } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const foodItemSchema = {
    type: Type.OBJECT,
    properties: {
        food: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        source: { type: Type.STRING }
    },
    required: ['food', 'calories', 'protein', 'source']
};

const mealSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "O nome ou horário da refeição (ex: '8h', 'Café da Manhã')." },
        items: {
            type: Type.ARRAY,
            items: foodItemSchema
        },
        totals: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
            },
            required: ['calories', 'protein']
        }
    },
    required: ['name', 'items', 'totals']
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        comparison: {
            type: Type.OBJECT,
            properties: {
                dietPlan: {
                    type: Type.OBJECT,
                    properties: {
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                    },
                    required: ['calories', 'protein']
                },
                consumed: {
                    type: Type.OBJECT,
                    properties: {
                        calories: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                    },
                    required: ['calories', 'protein']
                },
            },
            required: ['dietPlan', 'consumed']
        },
        dietPlanDetails: {
            type: Type.ARRAY,
            items: mealSchema
        },
        consumedDetails: {
            type: Type.ARRAY,
            items: mealSchema
        },
    },
    required: ['comparison', 'dietPlanDetails', 'consumedDetails']
};


const buildPrompt = (dietPlan: string, dailyIntake: string): string => {
    return `
      Você é um especialista em nutrição assistente de IA. Sua tarefa é analisar a dieta planejada e o consumo diário fornecidos, retornando uma análise nutricional detalhada em formato JSON.

      Siga estas instruções rigorosamente:

      1.  **Análise Passo a Passo:** Para cada item alimentar em ambas as listas:
          a. Identifique o nome do alimento e a quantidade especificada (ex: 150g, 2 fatias, 1 unidade).
          b. Pesquise os valores nutricionais (calorias e proteínas).
          c. Prioritize as fontes de dados na seguinte ordem: 1) Tabela Brasileira de Composição de Alimentos (TACO), 2) Banco de dados do USDA (para itens não encontrados na TACO), 3) Informações nutricionais do site oficial da marca para produtos industrializados. Sempre cite a fonte específica utilizada para cada item. Ao usar a Tabela TACO ou USDA, especifique o nome exato do item consultado entre parênteses. Ex: "Tabela TACO (Frango, filé, grelhado)".
          d. Calcule os valores totais de calorias e proteínas para a quantidade especificada.

      2.  **Agrupamento por Refeição:**
          a. Identifique as refeições (geralmente indicadas por um horário como '8h' ou um nome como 'Almoço').
          b. Agrupe os itens alimentares sob a refeição correta.
          c. Calcule os subtotais de calorias e proteínas para CADA refeição.

      3.  **Tratamento de Ambiguidade:**
          a. Se a quantidade de um item for ambígua (ex: "um prato de macarrão", "2 pães"), use uma estimativa padrão razoável (ex: "200g de macarrão cozido", "pão de forma, 2 fatias - 50g").
          b. Na fonte do item, indique que foi uma estimativa. Ex: "Estimativa padrão - Tabela TACO".

      4.  **Cálculo dos Totais:**
          a. Calcule os totais gerais de calorias e proteínas para o plano de dieta completo.
          b. Calcule os totais gerais de calorias e proteínas para o consumo diário completo.

      5.  **Formato de Saída:**
          a. Sua resposta DEVE ser um objeto JSON válido, sem nenhum texto, explicação ou markdown fora do objeto JSON.
          b. O JSON deve corresponder EXATAMENTE ao esquema fornecido.

      **Exemplo de Análise de um item:**
      - Input: "150g de peito de frango grelhado"
      - Passo 1: Alimento: Peito de frango grelhado. Quantidade: 150g.
      - Passo 2: Fonte Primária (TACO): "Frango, filé, grelhado" tem 159 kcal e 32g de proteína por 100g.
      - Passo 3: Cálculo: Calorias = 1.5 * 159 = 238.5. Proteína = 1.5 * 32 = 48.
      - Passo 4: Output JSON do item: { "food": "150g de peito de frango grelhado", "calories": 238.5, "protein": 48, "source": "Tabela TACO (Frango, filé, grelhado)" }

      Agora, analise os seguintes dados:

      Dieta Planejada:
      ---
      ${dietPlan}
      ---

      Consumo Diário:
      ---
      ${dailyIntake}
      ---
    `;
};

export const analyzeDiet = async (dietPlan: string, dailyIntake: string): Promise<AnalysisResult> => {
    const prompt = buildPrompt(dietPlan, dailyIntake);
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1, // Reduzido para respostas mais determinísticas e factuais
            },
        });

        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText) as AnalysisResult;
        return parsedResult;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Falha ao se comunicar com a API do Gemini. Verifique o console para mais detalhes.");
    }
};

const rankingSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Nome do item. Ex: 'Maçã'" },
            calories: { type: Type.NUMBER, description: "Valor calórico." },
            unit: { type: Type.STRING, description: "Unidade de medida. Ex: '100g', '1 fatia', '1 lata'" }
        },
        required: ['name', 'calories', 'unit']
    }
};

export const generateCalorieRanking = async (category: string): Promise<RankingCategory> => {
    const prompt = `Gere um ranking de calorias para a categoria "${category}". Inclua pelo menos 5-7 itens populares. Ordene do menos calórico para o mais calórico. Forneça a unidade de medida padrão para cada item (ex: 100g, 1 lata de 350ml, 1 fatia). Use fontes de dados confiáveis como a Tabela TACO ou USDA. Responda APENAS com o array JSON.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: rankingSchema,
                temperature: 0.2,
            },
        });

        const jsonText = response.text.trim();
        const items = JSON.parse(jsonText);
        
        return {
            id: `ranking-${Date.now()}`,
            categoryName: category,
            items: items.map((item: NewRankingItem, index: number) => ({ ...item, id: `item-${Date.now()}-${index}` })),
        };
    } catch (error) {
        console.error("Error generating calorie ranking:", error);
        throw new Error("Falha ao gerar o ranking de calorias.");
    }
};

const singleRankingItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Nome do item com a quantidade. Ex: '100g de Kiwi'" },
        calories: { type: Type.NUMBER, description: "Valor calórico para a quantidade especificada." },
        unit: { type: Type.STRING, description: "Unidade de medida usada. Ex: '100g'" }
    },
    required: ['name', 'calories', 'unit']
};

export const getNutritionalInfoForItem = async (itemDescription: string): Promise<NewRankingItem> => {
    const prompt = `Analise o seguinte item alimentar e retorne suas calorias. Use fontes de dados confiáveis (TACO, USDA). A resposta DEVE ser apenas o objeto JSON. Item: "${itemDescription}"`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: singleRankingItemSchema,
                temperature: 0.1,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error getting nutritional info for item:", error);
        throw new Error("Falha ao analisar o item.");
    }
};


const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "O nome da receita." },
        ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Uma lista dos ingredientes necessários, com quantidades."
        },
        instructions: {
            type: Type.STRING,
            description: "O passo-a-passo para preparar a receita, formatado com quebras de linha."
        }
    },
    required: ['name', 'ingredients', 'instructions']
};

export const generateRecipe = async (promptText: string): Promise<Omit<Recipe, 'id' | 'source'>> => {
    const prompt = `Gere uma receita saudável e prática baseada na seguinte descrição: "${promptText}". A receita deve ser clara e direta. Retorne APENAS o objeto JSON com os campos: name, ingredients (como um array de strings), e instructions (como uma única string com \\n para quebras de linha).`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 0.5,
            },
        });

        const jsonText = response.text.trim();
        const parsedRecipe = JSON.parse(jsonText);
        
        return parsedRecipe;

    } catch (error) {
        console.error("Error generating recipe:", error);
        throw new Error("Falha ao gerar a receita.");
    }
};

const calorieCalculationSchema = {
    type: Type.OBJECT,
    properties: {
        totalCalories: { type: Type.NUMBER, description: "O total de calorias estimado para a refeição." },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    food: { type: Type.STRING, description: "O nome do alimento identificado." },
                    calories: { type: Type.NUMBER, description: "As calorias estimadas para este item." },
                    notes: { type: Type.STRING, description: "Notas sobre a estimativa e a fonte da informação (ex: 'quantidade estimada de 100g, fonte: TACO')." }
                },
                required: ['food', 'calories']
            },
            description: "Uma lista detalhada dos alimentos e suas calorias."
        },
        notes: { type: Type.STRING, description: "Notas gerais sobre a análise, como a precisão da estimativa baseada na imagem." }
    },
    required: ['totalCalories', 'items']
};

export const calculateCaloriesFromInput = async (text: string, image?: { mimeType: string; data: string }): Promise<CalorieCalculationResult> => {
    const prompt = `
        Analise a seguinte refeição, descrita por texto e/ou imagem, e estime o total de calorias.
        Siga estas instruções rigorosamente:
        1. Identifique cada alimento presente.
        2. Se a quantidade não for especificada, estime uma porção padrão com base na imagem ou no bom senso.
        3. Para os valores calóricos, priorize as fontes de dados nesta ordem: 1) Tabela Brasileira de Composição de Alimentos (TACO), 2) Banco de dados do USDA, 3) Sites oficiais de marcas.
        4. Indique a fonte e se houve estimativa de quantidade nas notas do item.
        5. Some o total de calorias.
        6. Retorne APENAS o objeto JSON.

        Entrada do usuário: "${text}"
    `;

    const contents = [];
    contents.push({ text: prompt });
    if (image) {
        contents.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contents },
            config: {
                responseMimeType: "application/json",
                responseSchema: calorieCalculationSchema,
                temperature: 0.3,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CalorieCalculationResult;

    } catch (error) {
        console.error("Error calculating calories:", error);
        throw new Error("Falha ao calcular as calorias. A IA pode não ter conseguido analisar a entrada.");
    }
};

const favoriteFoodSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "O nome completo do alimento com a quantidade, ex: '100g de Abacate'." },
        calories: { type: Type.NUMBER, description: "O total de calorias." },
        protein: { type: Type.NUMBER, description: "O total de proteínas em gramas." },
        carbs: { type: Type.NUMBER, description: "O total de carboidratos em gramas." },
        fat: { type: Type.NUMBER, description: "O total de gorduras em gramas." }
    },
    required: ['name', 'calories', 'protein', 'carbs', 'fat']
};

export const analyzeFavoriteFood = async (foodDescription: string): Promise<Omit<FavoriteFood, 'id'>> => {
    const prompt = `
      Analise o seguinte alimento e forneça seus dados nutricionais (calorias, proteínas, carboidratos e gorduras).
      Siga estas instruções rigorosamente:
      1. Para obter os valores, priorize as fontes de dados na seguinte ordem: 1) Tabela Brasileira de Composição de Alimentos (TACO), 2) Banco de dados do USDA, 3) Sites oficiais de marcas para produtos industrializados.
      2. No campo 'name', inclua a fonte da informação entre parênteses. Ex: '100g de Abacate (TACO)'.
      3. A resposta DEVE ser apenas o objeto JSON.
      
      Alimento: "${foodDescription}"
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: favoriteFoodSchema,
                temperature: 0.1,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing favorite food:", error);
        throw new Error("Falha ao analisar o alimento.");
    }
};

export const findYoutubeVideo = async (exerciseName: string): Promise<string> => {
    const prompt = `
      Sua tarefa é encontrar um vídeo de demonstração REAL e FUNCIONAL no YouTube para o exercício "${exerciseName}".
      Use a ferramenta de busca para encontrar links.
      Após a busca, verifique os resultados e retorne APENAS a URL do vídeo mais relevante e que pareça ser de alta qualidade de um canal confiável de fitness.
      A URL deve ser um link válido e completo do YouTube (ex: https://www.youtube.com/watch?v=...).
      NÃO invente links. Se não encontrar um vídeo adequado, retorne a string "VIDEO_NOT_FOUND".
      NÃO retorne nenhum outro texto, markdown ou explicação. Apenas a URL ou "VIDEO_NOT_FOUND".
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.0,
            },
        });

        const url = response.text.trim();
        
        if (url === "VIDEO_NOT_FOUND" || !(url.startsWith("https://www.youtube.com/") || url.startsWith("https://youtu.be/"))) {
             throw new Error("Não foi possível encontrar um link válido do YouTube.");
        }
        
        return url;

    } catch (error) {
        console.error("Error finding YouTube video:", error);
        if (error instanceof Error && error.message.includes("YouTube")) {
            throw error;
        }
        throw new Error("Falha ao buscar vídeo com a IA.");
    }
};
