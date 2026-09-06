import { db } from './db';
import { cloudPushData } from './cloudSync';

/**
 * Procesa y genera automáticamente las instancias de gastos mensuales recurrentes
 * que aún no han sido registradas para los meses transcurridos hasta el mes actual.
 */
export async function processRecurringExpenses(userId) {
  if (!userId) return { generatedCount: 0 };

  try {
    const allExpenses = await db.expenses
      .filter(e => e.userId === userId || !e.userId)
      .toArray();

    // Obtener gastos marcados como plantilla recurrente
    const recurringTemplates = allExpenses.filter(e => e.isRecurring && !e.isRecurringInstance);

    if (recurringTemplates.length === 0) {
      return { generatedCount: 0 };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1 a 12

    let generatedCount = 0;

    for (const template of recurringTemplates) {
      if (template.recurringStatus === 'paused') continue;

      const startDate = new Date(template.date || template.createdAt || new Date());
      let startYear = startDate.getFullYear();
      let startMonth = startDate.getMonth() + 1;

      const recDay = parseInt(template.recurringDay) || startDate.getDate() || 1;

      // Iterar desde el mes siguiente al mes de creación hasta el mes actual
      let y = startYear;
      let m = startMonth + 1;
      if (m > 12) {
        m = 1;
        y++;
      }

      while (y < currentYear || (y === currentYear && m <= currentMonth)) {
        const monthStr = String(m).padStart(2, '0');
        const monthKey = `${y}-${monthStr}`;

        // Verificar si ya existe una instancia para este mes
        const existing = allExpenses.find(e => 
          (e.recurringParentId === template.id || (e.isRecurringInstance && e.description === template.description)) &&
          (e.date || '').startsWith(monthKey)
        );

        if (!existing) {
          const daysInMonth = new Date(y, m, 0).getDate();
          const actualDay = Math.min(recDay, daysInMonth);
          const dayStr = String(actualDay).padStart(2, '0');
          const instanceDate = `${monthKey}-${dayStr}`;

          const newInstance = {
            id: 'exp_rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            userId: template.userId || userId,
            date: instanceDate,
            category: template.category,
            amount: parseFloat(template.amount) || 0,
            description: template.description,
            batch: template.batch || 'Toda la Finca (General)',
            supplier: template.supplier || '',
            isRecurring: true,
            isRecurringInstance: true,
            recurringParentId: template.id,
            recurringDay: recDay,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await db.expenses.add(newInstance);
          allExpenses.push(newInstance);
          generatedCount++;
        }

        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
    }

    if (generatedCount > 0) {
      cloudPushData(userId).catch(err => console.warn('Cloud sync error after recurring expenses gen:', err));
    }

    return { generatedCount };
  } catch (error) {
    console.error('Error procesando gastos recurrentes:', error);
    return { generatedCount: 0, error };
  }
}
