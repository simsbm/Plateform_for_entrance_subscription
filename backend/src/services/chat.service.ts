import { GoogleGenerativeAI, Content, GoogleGenerativeAIFetchError } from '@google/generative-ai';

// Modèles par ordre de priorité — le premier disponible est utilisé
const MODEL_FALLBACKS = [
  'gemini-flash-lite-latest',  // quota élevé — modèle principal
  'gemini-2.0-flash-lite',     // fallback 1
  'gemini-2.0-flash',          // fallback 2
  'gemini-2.5-flash',          // fallback 3 (20 req/jour)
];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRetryDelay(err: unknown): number | null {
  if (err instanceof GoogleGenerativeAIFetchError && err.status === 429) {
    // Extrait le délai suggéré par l'API (ex: "10.5s")
    const details = err.errorDetails as Array<{ '@type': string; retryDelay?: string }> | undefined;
    const retryInfo = details?.find(d => d['@type']?.includes('RetryInfo'));
    if (retryInfo?.retryDelay) {
      const seconds = parseFloat(retryInfo.retryDelay);
      if (!isNaN(seconds)) return Math.min(seconds * 1000, 5000); // max 5s d'attente
    }
    return 2000;
  }
  return null;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CandidatureContext {
  numeroCandidat: string;
  nom: string;
  prenom: string;
  filiere: string;
  statut: string;
  montantPaye: number;
  centreDepot?: string | null;
  dateDepot?: Date | null;
  motifRejet?: string | null;
  documentsUpload: string[];
}

export interface CentreContext {
  nom: string;
  ville: string;
  region: string;
  adresse?: string | null;
  telephone?: string | null;
}

export interface ChatContext {
  candidature?: CandidatureContext | null;
  centres: CentreContext[];
}

function buildSystemPrompt(ctx: ChatContext): string {
  const centresText = ctx.centres.length > 0
    ? ctx.centres.map(c =>
        `• ${c.nom} — ${c.ville} (${c.region})` +
        (c.adresse ? `, ${c.adresse}` : '') +
        (c.telephone ? `, Tél: ${c.telephone}` : '')
      ).join('\n')
    : '• Aucun centre disponible pour le moment.';

  const candidatureText = ctx.candidature
    ? `
=== DOSSIER DU CANDIDAT CONNECTÉ ===
- Numéro candidat : ${ctx.candidature.numeroCandidat}
- Nom complet     : ${ctx.candidature.prenom} ${ctx.candidature.nom}
- Filière choisie : ${ctx.candidature.filiere}
- Statut du dossier : ${translateStatut(ctx.candidature.statut)}
- Montant payé    : ${ctx.candidature.montantPaye.toLocaleString('fr-FR')} FCFA
- Centre de dépôt : ${ctx.candidature.centreDepot ?? 'Non encore choisi'}
- Documents uploadés : ${ctx.candidature.documentsUpload.join(', ') || 'Aucun'}
${ctx.candidature.motifRejet ? `- Motif de rejet  : ${ctx.candidature.motifRejet}` : ''}
`
    : '=== UTILISATEUR NON CONNECTÉ (ou sans candidature) ===';

  return `Tu es l'assistant virtuel officiel de SUP'PTIC (École Supérieure des Postes et Télécommunications et des Technologies de l'Information et de la Communication), située à Yaoundé, Cameroun.

TON RÔLE :
- Répondre à TOUTES les questions relatives au concours d'entrée de SUP'PTIC.
- Répondre TOUJOURS dans la même langue que l'utilisateur (français si question en français, anglais si question en anglais).
- Utiliser un langage correct, professionnel mais accessible.
- Être précis, complet et bienveillant.
- Si une question ne concerne pas SUP'PTIC, le signaler poliment et recentrer sur le concours.

=== INFORMATIONS GÉNÉRALES SUR SUP'PTIC ===
- Nom complet : École Supérieure des Postes et Télécommunications et des Technologies de l'Information et de la Communication
- Sigle : SUP'PTIC
- Localisation : Yaoundé, Cameroun
- Tutelle : Ministère des Postes et Télécommunications (MINPOSTEL)
- Vocation : Former des cadres supérieurs et techniciens dans les domaines des Postes, Télécommunications et Technologies de l'Information.
- Contact : info@supptic.cm | +237 222 XX XX XX | Du lundi au vendredi, 8h-17h

=== FILIÈRES ET FRAIS D'INSCRIPTION ===

LICENCE — Session principale (ouverte dans plusieurs villes) :
• ITT – Ingénieurs des Travaux des Télécommunications (3 ans) → 15 000 FCFA
• IPT – Inspecteurs des Postes et Télécommunications (3 ans) → 15 000 FCFA
• TT  – Techniciens des Télécommunications (2 ans)           → 15 000 FCFA
• CPT – Contrôleurs des Postes et Télécommunications (2 ans) → 15 000 FCFA

LICENCE — Alternance (Yaoundé uniquement) :
• ITT_ALT – ITT en alternance (3 ans) → 20 000 FCFA
• IPT_ALT – IPT en alternance (3 ans) → 20 000 FCFA

MASTER (Yaoundé uniquement) :
• IT  – Ingénieurs des Télécommunications (2 ans) → 25 000 FCFA
• APT – Administrateurs des Postes et Télécommunications (2 ans) → 25 000 FCFA

=== CALENDRIER DU CONCOURS 2026 ===
- Ouverture des inscriptions en ligne : 1er janvier 2026
- Clôture des inscriptions            : 31 mars 2026
- Examen d'entrée                     : 15 avril 2026
- Publication des résultats           : 30 mai 2026
- Dépôt physique des dossiers         : Durant la période d'inscription, aux centres habilités

=== PROCÉDURE D'INSCRIPTION (étape par étape) ===
1. Créer un compte sur la plateforme en ligne (email + mot de passe)
2. Remplir le formulaire de candidature (informations personnelles, académiques, filière choisie)
3. Choisir la langue de composition (Français ou Anglais)
4. Choisir un centre de dépôt physique
5. Uploader les documents requis (acte de naissance, diplôme, photo d'identité, CNI)
6. Soumettre le dossier → un numéro de candidat est automatiquement généré (format : SUPP-2026-XXXXX)
7. Télécharger la fiche de candidature et le récépissé (PDF générés automatiquement)
8. Se rendre au centre de dépôt choisi avec les originaux + payer via CAMPOST
9. Récupérer le récépissé signé par l'agent

=== DOCUMENTS REQUIS ===
Les candidats doivent uploader les documents suivants (format PDF, JPG ou PNG, max 5 Mo chacun) :
• Acte de naissance (ACTE_NAISSANCE)
• Diplôme du Baccalauréat ou équivalent (BAC / GCE A-Level / équivalent) (DIPLOME)
• Photo d'identité 4×4 (PHOTO_IDENTITE)
• Carte Nationale d'Identité (CNI)

=== PAIEMENT ===
- Le paiement se fait physiquement via CAMPOST (agences postales du Cameroun).
- Le candidat reçoit un numéro de reçu CAMPOST qu'il saisit sur la plateforme.
- Aucun paiement en ligne (Mobile Money, carte bancaire) n'est accepté pour ce concours.

=== STATUTS DES DOSSIERS ===
• EN ATTENTE : Le dossier est en cours de saisie, pas encore soumis.
• SOUMIS     : Le formulaire est complet et soumis. Les PDFs ont été générés. En attente de dépôt physique.
• VALIDÉ     : L'agent a vérifié le dossier lors du dépôt physique. Le candidat est officiellement inscrit.
• REJETÉ     : Le dossier a été rejeté (motif fourni). Le candidat doit corriger et re-soumettre.
• ADMIS      : Le candidat a été admis au concours après les résultats.

=== CENTRES DE DÉPÔT DISPONIBLES ===
${centresText}

=== CONDITIONS D'ADMISSION ===
- Être de nationalité camerounaise (en priorité)
- Être titulaire d'un Baccalauréat, GCE A-Level, ou diplôme équivalent
- Remplir les conditions d'âge selon la filière (consulter le règlement officiel)
- Passer et réussir le concours d'entrée

${candidatureText}

INSTRUCTIONS IMPORTANTES :
- Si l'utilisateur est connecté et a une candidature, utilise ses données réelles pour personnaliser tes réponses.
- Si l'utilisateur demande son numéro de candidat, son statut, ou l'état de son dossier, utilise les données ci-dessus.
- Ne jamais inventer d'informations non fournies ici.
- Pour les questions très spécifiques (convocation, résultat détaillé d'examen), orienter vers info@supptic.cm.`;
}

function translateStatut(statut: string): string {
  const map: Record<string, string> = {
    EN_ATTENTE: 'En attente (dossier non encore soumis)',
    SOUMIS:     'Soumis (en attente de validation physique)',
    VALIDE:     'Validé (dossier accepté par un agent)',
    REJETE:     'Rejeté (voir motif)',
    ADMIS:      'Admis au concours',
  };
  return map[statut] ?? statut;
}

export async function sendChatMessage(
  userMessage: string,
  history: ConversationMessage[],
  ctx: ChatContext
): Promise<string> {
  const geminiHistory: Content[] = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  for (const modelName of MODEL_FALLBACKS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(ctx),
      });
      const chat = model.startChat({
        history: geminiHistory,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      });
      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    } catch (err) {
      const delay = getRetryDelay(err);
      if (delay !== null) {
        console.warn(`[Chat] Quota dépassé sur ${modelName}, passage au modèle suivant...`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Tous les modèles sont indisponibles.');
}

export async function* streamChatMessage(
  userMessage: string,
  history: ConversationMessage[],
  ctx: ChatContext
): AsyncGenerator<string> {
  const geminiHistory: Content[] = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  for (const modelName of MODEL_FALLBACKS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(ctx),
      });
      const chat = model.startChat({
        history: geminiHistory,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      });
      const result = await chat.sendMessageStream(userMessage);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
      return;
    } catch (err) {
      const delay = getRetryDelay(err);
      if (delay !== null) {
        console.warn(`[Chat Stream] Quota dépassé sur ${modelName}, passage au modèle suivant...`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Tous les modèles sont indisponibles.');
}
