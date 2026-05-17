import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendChatMessage, streamChatMessage, ConversationMessage, ChatContext } from '../services/chat.service';
import { ok, fail } from '../types';

export async function chat(req: Request, res: Response): Promise<void> {
  const { message, history } = req.body as {
    message: string;
    history: ConversationMessage[];
  };

  if (!message?.trim()) {
    res.status(400).json(fail('Le message ne peut pas être vide'));
    return;
  }

  // Récupère tous les centres de dépôt actifs
  const centres = await prisma.centreDepot.findMany({
    where: { actif: true },
    select: { nom: true, ville: true, region: true, adresse: true, telephone: true },
    orderBy: { ville: 'asc' },
  });

  const ctx: ChatContext = {
    centres,
    candidature: null,
  };

  // Si l'utilisateur est connecté, récupère sa candidature
  if (req.user) {
    const candidature = await prisma.candidature.findUnique({
      where: { userId: req.user.id },
      include: {
        documents: { select: { type: true } },
        centreDepot: { select: { nom: true, ville: true } },
      },
    });

    if (candidature) {
      ctx.candidature = {
        numeroCandidat: candidature.numeroCandidat,
        nom: candidature.nom,
        prenom: candidature.prenom,
        filiere: candidature.filiere,
        statut: candidature.statut,
        montantPaye: candidature.montantPaye,
        centreDepot: candidature.centreDepot
          ? `${candidature.centreDepot.nom} (${candidature.centreDepot.ville})`
          : null,
        dateDepot: candidature.dateDepot,
        motifRejet: candidature.motifRejet,
        documentsUpload: candidature.documents.map(d => d.type),
      };
    }
  }

  const safeHistory: ConversationMessage[] = Array.isArray(history)
    ? history.slice(-10)
    : [];

  try {
    const reply = await sendChatMessage(message.trim(), safeHistory, ctx);
    res.json(ok({ reply }));
  } catch (err) {
    console.error('[Chat] Erreur API Gemini :', err);
    res.status(500).json(fail('Le service de chat est temporairement indisponible. Veuillez réessayer.'));
  }
}

async function buildCtx(req: Request): Promise<{ ctx: ChatContext; safeHistory: ConversationMessage[] }> {
  const { history } = req.body as { history: ConversationMessage[] };

  const centres = await prisma.centreDepot.findMany({
    where: { actif: true },
    select: { nom: true, ville: true, region: true, adresse: true, telephone: true },
    orderBy: { ville: 'asc' },
  });

  const ctx: ChatContext = { centres, candidature: null };

  if (req.user) {
    const candidature = await prisma.candidature.findUnique({
      where: { userId: req.user.id },
      include: {
        documents: { select: { type: true } },
        centreDepot: { select: { nom: true, ville: true } },
      },
    });
    if (candidature) {
      ctx.candidature = {
        numeroCandidat: candidature.numeroCandidat,
        nom: candidature.nom,
        prenom: candidature.prenom,
        filiere: candidature.filiere,
        statut: candidature.statut,
        montantPaye: candidature.montantPaye,
        centreDepot: candidature.centreDepot
          ? `${candidature.centreDepot.nom} (${candidature.centreDepot.ville})`
          : null,
        dateDepot: candidature.dateDepot,
        motifRejet: candidature.motifRejet,
        documentsUpload: candidature.documents.map(d => d.type),
      };
    }
  }

  const safeHistory: ConversationMessage[] = Array.isArray(history) ? history.slice(-10) : [];
  return { ctx, safeHistory };
}

export async function chatStream(req: Request, res: Response): Promise<void> {
  const { message } = req.body as { message: string };

  if (!message?.trim()) {
    res.status(400).json(fail('Le message ne peut pas être vide'));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    const { ctx, safeHistory } = await buildCtx(req);

    for await (const chunk of streamChatMessage(message.trim(), safeHistory, ctx)) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
  } catch (err) {
    console.error('[Chat Stream] Erreur :', err);
    res.write(`data: ${JSON.stringify({ error: 'Service temporairement indisponible.' })}\n\n`);
  } finally {
    res.end();
  }
}
