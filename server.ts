import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

interface GenerateCharacterRequestBody {
  excludeNames?: string[];
  preferredClass?: string;
}

app.post('/api/generate-character', async (req: Request<{}, {}, GenerateCharacterRequestBody>, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key is not configured on the server. Please attach your API key in the Settings > Secrets panel.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const { excludeNames = [], preferredClass } = req.body;

    const classesList = [
      'Mage', 'Rogue', 'Warrior', 'Paladin', 'Ranger',
      'Druid', 'Warlock', 'Cleric', 'Bard', 'Monk',
      'Sorcerer', 'Necromancer', 'Alchemist', 'Artificer', 'Barbarian'
    ];
    const randomClassSuggestion = classesList[Math.floor(Math.random() * classesList.length)];
    const archetypes = [
      'High Fantasy', 'Dark Fantasy', 'Eldritch & Arcane', 'Solar & Divine',
      'Wilderness & Primal', 'Shadow & Stealth', 'Runic & Steampunk', 'Celestial & Astral'
    ];
    const chosenArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    const randomSeed = Math.floor(Math.random() * 1000000);

    const exclusionClause = excludeNames.length > 0
      ? `Do NOT use any of these previously generated names: ${excludeNames.slice(-20).join(', ')}. Create an entirely distinct, original character name.`
      : '';

    const classInstruction = preferredClass
      ? `The character MUST belong to the class: "${preferredClass}".`
      : `Choose an imaginative class (such as ${randomClassSuggestion}, or another fitting fantasy class like Mage, Rogue, Warrior, Paladin, Ranger, etc.).`;

    const prompt = `Create a completely unique, rich, and compelling fantasy character with a distinct Name and Class.
Archetype Inspiration: ${chosenArchetype}
Random Seed: ${randomSeed}
${classInstruction}
${exclusionClause}

Ensure the character is deeply imaginative and memorable. Every character must feel truly different with their own rich personality, homeland, signature gear, and backstory.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a master tabletop RPG author and character designer.
Your task is to invent unique, vivid, never-before-seen fantasy characters.
Every character MUST have:
1. "name": An evocative, distinctive fantasy name (e.g., 'Lyra Whisperwind', 'Kaelen Voidstrider', 'Branor Stonecrag', 'Seraphina Duskveil').
2. "class": A clear fantasy class (e.g. Mage, Rogue, Warrior, Paladin, Ranger, Druid, Warlock, Cleric, Bard, Monk, etc.).
Ensure high variance and creative originality across generations.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Unique and evocative fantasy character name.',
            },
            class: {
              type: Type.STRING,
              description: 'Character class (e.g. Mage, Rogue, Warrior, Paladin, Ranger, etc.).',
            },
            title: {
              type: Type.STRING,
              description: 'An epithet or legendary title (e.g., "The Ashen Sentinel", "Weaver of Aurora").',
            },
            race: {
              type: Type.STRING,
              description: 'Ancestry or race (e.g., Sun Elf, Deep Gnome, High Human, Dragonborn, Tiefling).',
            },
            origin: {
              type: Type.STRING,
              description: 'Homeland, realm, or kingdom of origin.',
            },
            alignment: {
              type: Type.STRING,
              description: 'Alignment (e.g., Chaotic Good, Lawful Neutral, Neutral Good).',
            },
            signatureItem: {
              type: Type.STRING,
              description: 'Signature weapon, staff, relic, or arcane instrument.',
            },
            backstory: {
              type: Type.STRING,
              description: 'A 2-3 sentence engaging backstory and motivation.',
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER, description: 'Rating 8-20' },
                dexterity: { type: Type.INTEGER, description: 'Rating 8-20' },
                constitution: { type: Type.INTEGER, description: 'Rating 8-20' },
                intelligence: { type: Type.INTEGER, description: 'Rating 8-20' },
                wisdom: { type: Type.INTEGER, description: 'Rating 8-20' },
                charisma: { type: Type.INTEGER, description: 'Rating 8-20' },
              },
              required: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
            },
          },
          required: ['name', 'class'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Received empty response from Gemini API.');
    }

    const characterData = JSON.parse(text);

    // Validate minimum required fields
    if (!characterData.name || !characterData.class) {
      throw new Error('Model generated incomplete character data missing Name or Class.');
    }

    return res.json({
      success: true,
      character: {
        id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: characterData.name.trim(),
        class: characterData.class.trim(),
        title: characterData.title?.trim() || 'Wanderer of Realms',
        race: characterData.race?.trim() || 'Unknown Kin',
        origin: characterData.origin?.trim() || 'The Far Reaches',
        alignment: characterData.alignment?.trim() || 'True Neutral',
        signatureItem: characterData.signatureItem?.trim() || 'Rune-inscribed blade',
        backstory: characterData.backstory?.trim() || 'A hero shaped by ancient trials and wanderlust.',
        stats: {
          health: Math.floor(Math.random() * 100) + 1,
          mana: Math.floor(Math.random() * 100) + 1,
          strength: Math.floor(Math.random() * 100) + 1,
        },
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating character:', error);
    const errorMessage = error?.message || 'Failed to generate character with Gemini API';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

interface GenerateBackstoryRequestBody {
  name: string;
  className: string;
  race?: string;
  title?: string;
}

app.post('/api/generate-backstory', async (req: Request<{}, {}, GenerateBackstoryRequestBody>, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key is not configured on the server. Please attach your API key in the Settings > Secrets panel.',
      });
    }

    const { name, className, race, title } = req.body;

    if (!name || !className) {
      return res.status(400).json({
        success: false,
        error: 'Name and Class are required to generate a backstory.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Write a unique, captivating, one-to-two-sentence origin story for the fantasy character named "${name}", who is a ${className}.${race ? ` Race: ${race}.` : ''}${title ? ` Title: ${title}.` : ''}
Focus on what sparked their journey and their defining quest.
Requirement: It MUST be exactly one or two sentences long. Write evocative fantasy lore without any introductory label or quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an ancient master chronicler and storyteller. Craft profound, atmospheric, exactly one-to-two-sentence origin stories tailored to the character name and class provided. Do not use quotes, prefixes, or markdown headers.',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Received empty backstory from Gemini API.');
    }

    return res.json({
      success: true,
      backstory: text,
    });
  } catch (error: any) {
    console.error('Error generating backstory:', error);
    const errorMessage = error?.message || 'Failed to generate backstory with Gemini API';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

interface GeneratePortraitRequestBody {
  name: string;
  className: string;
  race?: string;
  title?: string;
  signatureItem?: string;
  variation?: number;
}

app.post('/api/generate-portrait', async (req: Request<{}, {}, GeneratePortraitRequestBody>, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key is not configured on the server. Please attach your API key in the Settings > Secrets panel.',
      });
    }

    const { name, className, race, title, signatureItem, variation = 0 } = req.body;

    if (!name || !className) {
      return res.status(400).json({
        success: false,
        error: 'Name and Class are required to generate a character portrait.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const variations = [
      'heroic frontal portrait, confident smile, radiant warm backlight, iconic champion pose',
      'three-quarter dynamic battle stance, dramatic rim lighting, fierce gaze, ready for adventure',
      'mystical spellcasting pose with glowing magical runes and ethereal swirling energy aura',
      'intense focused expression, atmospheric cinematic shadows and particle sparks',
      'candid adventurer posture, vibrant cel-shaded style, detailed fantasy gear',
    ];
    const chosenVariation = variations[Number(variation) % variations.length];

    const prompt = `A colorful cartoon and video game style portrait of the fantasy character named "${name}", who is a ${className}.
${title ? `Title: ${title}.` : ''}
${race ? `Ancestry/Race: ${race}.` : ''}
${signatureItem ? `Signature Item: ${signatureItem}.` : ''}
Pose and mood: ${chosenVariation}.
Style: High quality stylized 2D/3D cartoon video game character art, clean outlines, rich vibrant colors, expressive face, head-and-shoulders fantasy hero avatar, polished game concept art portrait. No text, no watermarks, no speech bubbles.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    let imageUrl: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('The Gemini image model did not return any image data.');
    }

    return res.json({
      success: true,
      imageUrl,
    });
  } catch (error: any) {
    console.error('Error generating portrait:', error);
    const errorMessage = error?.message || 'Failed to generate character portrait with Gemini API';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fantasy Character Creator server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
