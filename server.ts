import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import cors from 'cors';
import fs from 'fs';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Endpoint for AI Product Descriptions
  app.post('/api/ai/generate-descriptions', async (req, res) => {
    try {
      const { name, category, subcategory, currentDescription, images } = req.body;

      const prompt = `Actúa como un experto en marketing digital y ventas de equipo táctico, de iluminación y outdoors. 
Genera exactamente 5 descripciones persuasivas y vendedoras para el siguiente producto:
Nombre: ${name}
Categoría: ${category}
${subcategory ? `Subcategoría: ${subcategory}` : ''}
Descripción actual (como contexto): ${currentDescription || 'No proporcionada'}

REGLAS:
1. Las descripciones deben ser variadas (una técnica, una emocional, una enfocada en beneficios, una corta y directa, una narrativa).
2. Usa un lenguaje profesional pero cercano.
3. Resalta la durabilidad, calidad y utilidad del equipo.
4. Responde ÚNICAMENTE con un array JSON de strings, sin markdown, sin texto adicional.
Ejemplo: ["desc1", "desc2", "desc3", "desc4", "desc5"]`;

      const contents: any[] = [{ text: prompt }];

      // Add up to 2 images for context if available
      if (images && images.length > 0) {
        for (const imageUrl of images.slice(0, 2)) {
          try {
            const imageRes = await fetch(imageUrl);
            const imageBuffer = await imageRes.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            contents.push({
              inlineData: {
                mimeType: imageRes.headers.get('content-type') || 'image/jpeg',
                data: base64Image
              }
            });
          } catch (err) {
            console.warn('Failed to fetch image for AI:', imageUrl);
          }
        }
      }

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: contents }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = result.text;
      const descriptions = JSON.parse(text || '[]');

      res.json({ descriptions });
    } catch (error) {
      console.error('AI Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate descriptions', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Helper to inject meta tags
  const injectMetaTags = async (html: string, req: express.Request) => {
    const id = req.params.id;
    if (id) {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('./src/firebase/config');
        
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const product = docSnap.data();
          const priceFormatted = product.price ? ` — $${new Intl.NumberFormat('es-MX').format(product.price)} MXN` : '';
          const title = `${product.name}${priceFormatted}`;
          const description = (product.description || '').substring(0, 160).replace(/"/g, '&quot;');
          const image = product.images?.[0] || '';
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const url = `${baseUrl}${req.originalUrl}`;

          const metaTags = `
    <title>${title}</title>
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="product" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />`;

          if (html.includes('<title>')) {
            html = html.replace(/<title>.*?<\/title>/, metaTags);
          } else {
            html = html.replace('<head>', `<head>${metaTags}`);
          }
        }
      } catch (error) {
        console.error('Error fetching product for meta tags:', error);
      }
    }
    return html;
  };
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
  });

  // API Endpoint for Image Optimization
  app.post('/api/optimize-image', upload.single('image'), async (req, res) => {
    console.log('Received optimization request');
    try {
      if (!req.file) {
        console.log('No file received');
        return res.status(400).json({ error: 'No image provided' });
      }
      console.log('File info:', { size: req.file.size, mimetype: req.file.mimetype });

      let pipeline = sharp(req.file.buffer);

      // Get metadata to check dimensions
      const metadata = await pipeline.metadata();

      // Smart Resizing: Max width 1920px
      if (metadata.width && metadata.width > 1920) {
        pipeline = pipeline.resize({ width: 1920, withoutEnlargement: true });
      }

      // Convert to WebP with Near-Lossless quality (85-90)
      const optimizedBuffer = await pipeline
        .webp({ 
          quality: 85,
          effort: 6, // High compression effort
        })
        .toBuffer();

      res.set('Content-Type', 'image/webp');
      res.send(optimizedBuffer);
    } catch (error) {
      console.error('Optimization error:', error);
      res.status(500).json({ error: 'Failed to optimize image' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Special handler for product social sharing previews
    app.get('/product/:id', async (req, res, next) => {
      try {
        let html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        html = await injectMetaTags(html, req);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch (e) {
        // If injection fails, just continue to normal Vite serving
        next();
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Special handler for product social sharing previews in production
    app.get('/product/:id', async (req, res, next) => {
      try {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf-8');
          html = await injectMetaTags(html, req);
          res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
        } else {
          next();
        }
      } catch (error) {
        next();
      }
    });

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
