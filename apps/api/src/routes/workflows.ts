/**
 * Workflow Approval Routes
 *
 * POST /api/v1/workflows/:id/approve — Execute stock/ledger mutation in a Neon transaction
 * POST /api/v1/workflows/:id/reject  — Reject a pending workflow
 * GET  /api/v1/workflows             — List pending workflows
 */
import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { createDb } from '../db/index.js';
import { workflowApprovals, inventoryItems } from '../db/schema.js';
import type { AuthEnv, AuthVariables } from '../middleware/auth.js';

const workflows = new Hono<{
  Bindings: AuthEnv;
  Variables: AuthVariables;
}>();

// List pending workflow approvals
workflows.get('/', async (c) => {
  const merchantId = c.get('merchantId');
  const db = createDb({ DATABASE_URL: c.env.DATABASE_URL });

  const pending = await db
    .select()
    .from(workflowApprovals)
    .where(
      and(
        eq(workflowApprovals.merchantId, merchantId),
        eq(workflowApprovals.status, 'PENDING'),
      ),
    )
    .orderBy(workflowApprovals.createdAt);

  return c.json({ workflows: pending });
});

// Approve a workflow
workflows.post('/:id/approve', async (c) => {
  const workflowId = c.req.param('id');
  const merchantId = c.get('merchantId');
  const db = createDb({ DATABASE_URL: c.env.DATABASE_URL });

  // Fetch the workflow
  const [workflow] = await db
    .select()
    .from(workflowApprovals)
    .where(
      and(
        eq(workflowApprovals.id, workflowId),
        eq(workflowApprovals.merchantId, merchantId),
      ),
    )
    .limit(1);

  if (!workflow) {
    return c.json({ error: 'Workflow not found' }, 404);
  }

  if (workflow.status !== 'PENDING') {
    return c.json({ error: `Workflow already ${workflow.status.toLowerCase()}` }, 409);
  }

  const payload = workflow.payloadJson as Record<string, unknown>;

  // Execute the action based on intent
  try {
    if (workflow.intent === 'DEDUCT_INVENTORY' || workflow.intent === 'RESTOCK_INVENTORY') {
      const itemName = (payload as any)?.entities?.itemName;
      const quantity = (payload as any)?.entities?.quantity;

      if (itemName && quantity) {
        // Find the inventory item
        const items = await db
          .select()
          .from(inventoryItems)
          .where(eq(inventoryItems.merchantId, merchantId));

        const item = items.find(
          (i) => i.nameEnglish.toLowerCase() === itemName.toLowerCase(),
        );

        if (item) {
          const currentQty = parseFloat(item.currentStockQty);
          const newQty =
            workflow.intent === 'DEDUCT_INVENTORY'
              ? currentQty - quantity
              : currentQty + quantity;

          await db
            .update(inventoryItems)
            .set({
              currentStockQty: String(newQty),
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, item.id));
        }
      }
    }

    // Mark workflow as approved
    const [updated] = await db
      .update(workflowApprovals)
      .set({
        status: 'APPROVED',
        resolvedAt: new Date(),
      })
      .where(eq(workflowApprovals.id, workflowId))
      .returning();

    return c.json({ success: true, workflow: updated });
  } catch (error) {
    console.error('Workflow approval error:', error);
    return c.json(
      { error: 'Failed to execute workflow', message: error instanceof Error ? error.message : 'Unknown error' },
      500,
    );
  }
});

// Reject a workflow
workflows.post('/:id/reject', async (c) => {
  const workflowId = c.req.param('id');
  const merchantId = c.get('merchantId');
  const db = createDb({ DATABASE_URL: c.env.DATABASE_URL });

  const [updated] = await db
    .update(workflowApprovals)
    .set({
      status: 'REJECTED',
      resolvedAt: new Date(),
    })
    .where(
      and(
        eq(workflowApprovals.id, workflowId),
        eq(workflowApprovals.merchantId, merchantId),
      ),
    )
    .returning();

  if (!updated) {
    return c.json({ error: 'Workflow not found' }, 404);
  }

  return c.json({ success: true, workflow: updated });
});

export { workflows };

