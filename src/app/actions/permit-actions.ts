'use server'

import { authenticateToken } from '@/lib/api-auth'
import { sb } from '@lib/supabase'
import { revalidatePath } from 'next/cache'

type ToggleResult = {
  success: boolean
  action: 'saved' | 'ignored' | null
  message: string
}

/**
 * Toggle a permit action (save/ignore)
 *
 * Logic:
 * - If action exists and same → Remove (toggle off)
 * - If action exists and different → Update (switch)
 * - If no action → Insert (toggle on)
 */
export async function togglePermitAction(
  token: string,
  permitId: string,
  action: 'saved' | 'ignored',
): Promise<ToggleResult> {
  // 1. Authenticate
  const auth = await authenticateToken(token)
  if (!auth.success) {
    return { success: false, action: null, message: 'Not authenticated' }
  }

  const userId = auth.userId

  // 2. Validate inputs
  if (!permitId || !action) {
    return { success: false, action: null, message: 'Invalid parameters' }
  }

  if (action !== 'saved' && action !== 'ignored') {
    return { success: false, action: null, message: 'Invalid action type' }
  }

  try {
    // 3. Check if action already exists
    const { data: existing, error: fetchError } = await sb
      .from('user_permit_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('permit_id', permitId)
      .maybeSingle()

    if (fetchError) {
      return {
        success: false,
        action: null,
        message: `Failed to fetch action: ${fetchError.message}`,
      }
    }

    // 4. Toggle logic
    if (existing) {
      if (existing.action === action) {
        // Same action → Remove (toggle off)
        const { error: deleteError } = await sb
          .from('user_permit_actions')
          .delete()
          .eq('id', existing.id)

        if (deleteError) {
          return {
            success: false,
            action: null,
            message: `Failed to remove action: ${deleteError.message}`,
          }
        }

        revalidatePath('/app')
        return {
          success: true,
          action: null,
          message: action === 'saved' ? 'Permit unsaved' : 'Permit unignored',
        }
      }

      // Different action → Update (switch)
      const { error: updateError } = await sb
        .from('user_permit_actions')
        .update({
          action,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) {
        return {
          success: false,
          action: null,
          message: `Failed to update action: ${updateError.message}`,
        }
      }

      revalidatePath('/app')
      return {
        success: true,
        action,
        message: action === 'saved' ? 'Permit saved' : 'Permit ignored',
      }
    }

    // No existing action → Insert (toggle on)
    const { error: insertError } = await sb.from('user_permit_actions').insert({
      user_id: userId,
      permit_id: permitId,
      action,
    })

    if (insertError) {
      return {
        success: false,
        action: null,
        message: `Failed to save action: ${insertError.message}`,
      }
    }

    revalidatePath('/app')
    return {
      success: true,
      action,
      message: action === 'saved' ? 'Permit saved' : 'Permit ignored',
    }
  } catch (error) {
    return {
      success: false,
      action: null,
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
