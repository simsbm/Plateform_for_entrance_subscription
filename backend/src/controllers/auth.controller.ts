import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ok, fail } from '../types';

const RegisterSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function signToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail('Données invalides', parsed.error.flatten().fieldErrors));
    return;
  }

  const { email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json(fail('Cet email est déjà utilisé'));
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: 'CANDIDAT' },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.status(201).json(ok({ user, token }, 'Compte créé avec succès'));
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail('Email ou mot de passe invalide'));
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json(fail('Identifiants incorrects'));
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json(fail('Identifiants incorrects'));
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json(ok({
    user: { id: user.id, email: user.email, role: user.role },
    token,
  }, 'Connexion réussie'));
}

// GET /api/auth/me
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, role: true, createdAt: true,
      candidature: {
        select: { id: true, numeroCandidat: true, statut: true, filiere: true },
      },
      centre: { select: { id: true, nom: true, ville: true } },
    },
  });

  if (!user) {
    res.status(404).json(fail('Utilisateur introuvable'));
    return;
  }

  res.json(ok(user));
}
