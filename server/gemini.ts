import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
];
for (const envFile of envPaths) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

import { Express, Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

function getAiClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY environment variable is missing on server. Please set GEMINI_API_KEY in your .env file or server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

export function setupGeminiServices(app: Express, server: http.Server, getProjectsData: () => any[]) {
  // 1. Gemini Multi-Turn Context-Aware Chatbot Endpoint
  app.post('/api/gemini/chat', async (req: Request, res: Response) => {
    try {
      const { messages, model = 'gemini-3.5-flash', customSystemPrompt } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      // Check API Key
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(500).json({
          error: 'GEMINI_API_KEY environment variable is missing on the server. Please check your .env file.'
        });
      }

      // Create full contextual background from current portfolio projects
      const projects = getProjectsData();
      const projectSummaryContext = projects.map((p, idx) => `
Project #${idx + 1}:
- Name: ${p.name}
- ID: ${p.id}
- Summary: ${p.summary}
- Description: ${p.description}
- Status: ${p.status} (Approval: ${p.approvalStatus || 'PENDING_REVIEW'})
- Owner: ${p.owner} (${p.ownerEmail})
- Supervisor: ${p.supervisor} (${p.supervisorEmail})
- Tech Stack: ${p.techStack ? p.techStack.join(', ') : 'None'}
- Deployment Date: ${p.deploymentDate}
- Lines of Code: ${p.linesOfCode} | Test Coverage: ${p.testCoverage}%
- Priority: ${p.priority}
      `).join('\n---\n');

      const systemInstruction = customSystemPrompt || `
You are the AI Enterprise Architect & Engineering Assistant for this Team Software Project Portfolio Dashboard.
You have real-time context on all current projects in the enterprise portfolio:
${projectSummaryContext}

Your responsibilities:
1. Provide concise, professional, insightful answers regarding architecture, tech stack distribution, test coverage, deployment dates, and team member workloads.
2. Recommend engineering best practices, microservice patterns, and pipeline optimizations when requested.
3. Be friendly, articulate, and accurate when referencing specific project names, technologies, or team members.
4. If code snippets or lists are requested, use clean, well-formatted Markdown with code blocks.
      `.trim();

      // Ensure model is valid
      const validModels = ['gemini-3.5-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'];
      const targetModel = validModels.includes(model) ? model : 'gemini-3.5-flash';

      // Format conversation for chat or generateContent
      const lastMessage = messages[messages.length - 1];
      const previousHistory = messages.slice(0, messages.length - 1);

      // Create chat instance or use generateContent with history
      const formattedContents = previousHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content || msg.text || '' }]
      }));

      // Add user prompt
      formattedContents.push({
        role: 'user',
        parts: [{ text: lastMessage.content || lastMessage.text || '' }]
      });

      const response = await getAiClient().models.generateContent({
        model: targetModel,
        contents: formattedContents as any,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const responseText = response.text || 'No response generated.';

      return res.json({
        text: responseText,
        model: targetModel,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Gemini Chat API error:', err);
      return res.status(500).json({
        error: err.message || 'Error executing Gemini chat request'
      });
    }
  });

  // 2. Low-Latency Responses Endpoint (Gemini 3.1 Flash-Lite)
  app.post('/api/gemini/flash-lite', async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const { prompt, projectId, queryType = 'summary' } = req.body;

      if (!prompt && !projectId) {
        return res.status(400).json({ error: 'Prompt or projectId is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is missing on the server.'
        });
      }

      let contextText = '';
      if (projectId) {
        const project = getProjectsData().find((p: any) => p.id === projectId);
        if (project) {
          contextText = `Project Data: Name: ${project.name}, Summary: ${project.summary}, Description: ${project.description}, Tech: ${project.techStack?.join(', ')}, Status: ${project.status}, Test Coverage: ${project.testCoverage}%, Owner: ${project.owner}.`;
        }
      }

      const inputPrompt = prompt || `Give a bulleted 3-point instant executive summary for this project: ${contextText}`;

      const response = await getAiClient().models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: inputPrompt,
        config: {
          systemInstruction: 'You are Gemini 3.1 Flash-Lite, optimized for sub-second ultra-low-latency responses. Give direct, sharp, bulleted or short answer without fluff.',
          temperature: 0.2,
        }
      });

      const latencyMs = Date.now() - startTime;

      return res.json({
        text: response.text || '',
        latencyMs,
        model: 'gemini-3.1-flash-lite',
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error('Gemini Flash-Lite API error:', err);
      return res.status(500).json({
        error: err.message || 'Error executing Flash-Lite low-latency request'
      });
    }
  });

  // 3. Gemini Live Real-Time Voice WebSocket (/ws/live)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws/live' || url.pathname === '/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error('WebSocket upgrade handler error:', err);
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('Gemini Live WebSocket client connected');
    let session: any = null;

    try {
      if (!process.env.GEMINI_API_KEY) {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: 'GEMINI_API_KEY environment variable is missing on server.'
        }));
        clientWs.close();
        return;
      }

      const projects = getProjectsData();
      const briefProjectContext = projects.map(p => `- ${p.name} (${p.status}, Tech: ${p.techStack?.slice(0, 3).join(', ')})`).join('\n');

      session = await getAiClient().live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are the Real-time AI Voice Assistant for the Team Software Portfolio Dashboard. 
You communicate via low-latency spoken voice.
Current active portfolio context:
${briefProjectContext}

Keep responses conversational, concise, natural, and informative. When asked about projects or technology, give clear spoken summaries.`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            try {
              const parts = message.serverContent?.modelTurn?.parts || [];
              let audioData: string | undefined = undefined;
              let textData: string | undefined = undefined;

              for (const part of parts) {
                if (part.inlineData?.data) {
                  audioData = part.inlineData.data;
                }
                if (part.text) {
                  textData = part.text;
                }
              }

              if (audioData) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: 'audio',
                    audio: audioData,
                    text: textData
                  }));
                }
              }

              if (message.serverContent?.interrupted) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }
              }

              if (message.serverContent?.turnComplete) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'turnComplete' }));
                }
              }
            } catch (msgErr) {
              console.error('Error handling Gemini Live onmessage callback:', msgErr);
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live Session error callback:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                message: err?.message || 'Gemini Live Session encountered an error'
              }));
            }
          },
          onclose: () => {
            console.log('Gemini Live session closed');
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          }
        },
      });

      // Send connected status to client
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'connected', message: 'Connected to Gemini Live Real-time API' }));
      }

      // Client incoming audio or text stream handler
      clientWs.on('message', (data: any) => {
        try {
          const payload = JSON.parse(data.toString());

          if (payload.type === 'audio' && payload.audio) {
            session.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          } else if (payload.type === 'text' && payload.text) {
            session.sendRealtimeInput({
              text: payload.text
            });
          }
        } catch (inputErr) {
          console.error('Error processing client input for Live API:', inputErr);
        }
      });

      clientWs.on('close', () => {
        if (session) {
          try {
            session.close();
          } catch (e) {
            // ignore
          }
        }
      });

    } catch (err: any) {
      console.error('Failed to create Gemini Live connection:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          message: err?.message || 'Failed to establish Gemini Live API connection'
        }));
        clientWs.close();
      }
    }
  });
}
