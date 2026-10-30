import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';

export async function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const supabase = req.supabase!;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || user.user_metadata?.full_name || 'User',
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

